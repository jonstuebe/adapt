import React, { Component } from 'react';
import _ from 'lodash';

import Dropzone from 'react-dropzone';
import {
  Button,
  SegmentedControl,
  SegmentedControlItem,
  Checkbox,
  Text,
  Label,
  TextInput,
  ProgressCircle
} from 'react-desktop/macOs';
import InputWrapper from './components/InputWrapper';
import Highlight from 'react-highlight';

import './App.css';
import './styles/highlight-theme-xcode.css';
// import IconXls from './images/icon-xls.png';
import Logo from './images/logo.png';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const XLSX = electron.remote.require('xlsx');
const knex = electron.remote.require('knex');
const ipcRenderer = electron.ipcRenderer;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      file: null,
      optionsSelected: 1,
      sheetName: 'data',
      tableName: '',
      runAsTransaction: true,
      outputType: 'sql',
      preview: {
        active: false,
        loading: false,
        types: {
          sql: null,
          json: null
        }
      },
      knex : knex({ client: 'postgresql' }),
    }
  }

  enablePreview = () => {
    this.setState((prevState) => {
      prevState.preview.active = true;
      prevState.preview.loading = true;
      return prevState;
    });

    this.parseWorkbook();
  }

  onDrop = (acceptedFiles) => {
    this.setState({
      file: acceptedFiles[0],
    }, () => {
      this.setState({ workbook: XLSX.readFile(this.state.file.path) });
    });
  }

  getColumns = (sheetName) => {
    const worksheet = this.state.workbook.Sheets[sheetName];
    let columns = [];
    for (let cell in worksheet) {
      if(cell[0] === '!') continue;
      if(Number(cell.replace(/[A-Z]*/,'')) !== 1) break;
      columns.push(worksheet[cell].v);
    }
    return columns;
  }

  getSql = (json) => {
    let sql = [];

    _.each(json, (row, index) => {
      row = JSON.parse(JSON.stringify(row));
      sql.push(this.state.knex(this.state.tableName).insert(row).toString() + ';');
    });

    if (this.state.runAsTransaction) {
      sql.unshift('BEGIN;\n');
      sql.push('\nCOMMIT;');
    }

    return sql.join('\n');
  }

  parseWorkbook = (callback = _.noop) => {
    const workbook = this.state.workbook;
    const firstSheetName = workbook.SheetNames[0];

    this.setState((prevState) => {

      const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
      const sql = this.getSql(json);

      prevState.sheet = {
        name: firstSheetName,
        json,
        columns: this.getColumns(firstSheetName)
      };

      prevState.preview.types.json = JSON.stringify(json, null, 2);
      prevState.preview.types.sql = sql;
      prevState.preview.loading = false;

      return prevState;
    }, callback);
  }

  saveFile = () => {
    this.parseWorkbook(() => {
      let fileName = `${this.state.tableName}.${this.state.outputType}`;

      ipcRenderer.send('save-file', {
        fileName,
        data: this.state.preview.types[this.state.outputType]
      });

    });
  }

  render() {
    return (
      <div className="App">

        <img src={Logo} alt="Adapt" style={{ width: 200, margin: '40px auto', display: 'block' }} />

        <div
          style={{
            width: '80%',
            maxWidth: 550,
            margin: '20px auto',
          }}
        >
          {!this.state.file ? (
            <Dropzone
              onDrop={this.onDrop}
              style={{
                height: '250px',
                borderWidth: '2px',
                borderColor: 'rgb(102, 102, 102)',
                borderStyle: 'dashed',
                borderRadius: '5px',
                position: 'relative',
                textAlign: 'center'
              }}
              multiple={false}
              accept={'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'}
              >
              <Text style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%' }}>Drag CSV/XLSX Files Here</Text>
            </Dropzone>
          ) : (
            <div>

              <SegmentedControl box>

                <SegmentedControlItem
                  title='Basic'
                  selected={this.state.optionsSelected === 1}
                  onSelect={() => this.setState({ optionsSelected: 1 })}
                >
                  <form
                    style={{
                      width: '50%',
                      margin: '0 auto'
                    }}
                    >

                    <InputWrapper>
                      <TextInput
                        label='Database Table Name'
                        placeholder='Enter Table Name'
                        focusRing={false}
                        value={this.state.tableName}
                        onChange={(e) => {
                          this.setState({ tableName : e.target.value });
                        }}
                      />
                    </InputWrapper>

                    <InputWrapper>
                      <Label>Export To</Label>
                      <select
                        style={{ width: '100%', display: 'block', marginBottom: '15px' }}
                        onChange={(e) => {
                          this.setState({ outputType: e.target.value });
                        }}
                        value={this.state.outputType}
                      >
                        <option value="sql">sql</option>
                        <option value="json">{'json'}</option>
                      </select>
                    </InputWrapper>

                    <span style={{ clear: 'both', display: 'block' }}></span>
                  </form>
                </SegmentedControlItem>
                <SegmentedControlItem
                  title='Advanced'
                  selected={this.state.optionsSelected === 2}
                  onSelect={() => this.setState({ optionsSelected: 2 })}
                >
                  <form
                    style={{
                      width: '50%',
                      margin: '0 auto'
                    }}
                  >
                    <InputWrapper>
                      <TextInput
                        label='Default Sheet'
                        placeholder='Enter Sheet Name'
                        focusRing={false}
                        value={this.state.sheetName}
                        onChange={(e) => {
                          this.setState({ sheetName : e.target.value });
                        }}
                      />
                    </InputWrapper>
                    <InputWrapper>
                      <Checkbox
                        onChange={(e) => {
                          this.setState({ runAsTransaction: e.target.checked });
                        }}
                        defaultChecked={true}
                        label='Run as Transaction'
                      />
                    </InputWrapper>
                  </form>
                </SegmentedControlItem>
              </SegmentedControl>

              <div style={{ marginBottom: 20 }}>
                <Button
                  marginTop='15'
                  style={{ float: 'right', marginLeft: 10 }}
                  onClick={this.saveFile}
                >
                  Generate
                </Button>
                <Button
                  marginTop='15'
                  style={{ float: 'right' }}
                  onClick={this.enablePreview}
                >Preview</Button>
                <div style={{ clear: 'both' }}></div>
              </div>
            </div>
          )}

          {(this.state.preview.active === true) ? (
            <div
              style={{
                height: 300,
                overflow: 'auto'
              }}
            >
              {(this.state.preview.loading) ? (
                <ProgressCircle size={25} />
              ) : (
                <Highlight
                  className={this.state.outputType}
                  style={{
                    width: '100%',
                    margin: 0
                  }}
                >
                  {this.state.preview.types[this.state.outputType]}
                </Highlight>
              )}
            </div>
          ) : null}

        </div>
      </div>
    );
  }
}

export default App;
