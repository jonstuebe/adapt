import React from 'react';

export default class InputWrapper extends React.Component {
  render() {
    return (
      <div style={{ marginBottom: 15 }}>
        {this.props.children}
      </div>
    );
  }
}
