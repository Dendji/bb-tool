import React, { Component } from 'react';
import PropTypes from 'prop-types';

// при наведении на край появляются rects на которые можно нажимать и расстягивать
export class BoundingBox extends Component {
  static propTypes = {
    start: PropTypes.array.isRequired,
    end: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
  };

  state = {
    isDragging: false,
    lastMouseX: this.props.start[0],
    lastMouseY: this.props.start[1],
    direction: null,
    isHover: false,
    isCreating:
      this.props.start[0] === this.props.end[0] &&
      this.props.start[1] === this.props.end[1]
  };

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
    if (this.state.isCreating) {
      document.body.addEventListener('mousemove', this.creatingMouseMove);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  render() {
    const { start, end } = this.props;
    const { isHover } = this.state;
    const lastCoord = start[0] - end[0];
    return (
      <g>
        <path
          d={`m ${start[0]} ${start[1]} l ${end[0] - start[0]} 0 l 0 ${end[1] -
            start[1]} l ${lastCoord} 0 z`}
          style={{ stroke: '#cecece', fill: 'rgba(255, 224, 25, .6)' }}
          // onMouseUp={this.handleMouseUp}
          onMouseDown={this.handleMouseDown}
          onClick={this.handleClick}
          onMouseOver={this.handleMouseEnter}
          onMouseOut={this.handleMouseLeave}
          onMouse
          className='bounding-box'
          stroke='#00b400'
          strokeWidth='4'
        />

        <g>
          {isHover && (
            <text
              x={start[0] + Math.abs(end[0] - start[0]) / 2 - 5}
              y={start[1] + Math.abs(end[1] - start[1]) / 2 + 5}
              style={{
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#cecece'
              }}
              fill='#cecece'
              onMouseDown={this.handleDelete}
            >
              ✖
            </text>
          )}

          <rect
            x={start[0]}
            y={start[1] - 10}
            width={end[0] - start[0]}
            height='20'
            style={{
              fill: 'rgba(0,0,0,0)',
              strokeWidth: 5,
              cursor: 'n-resize'
            }}
            onMouseDown={e => this.startResize(e, 'top')}
          />
          <rect
            x={end[0] - 10}
            y={start[1]}
            width='20'
            height={end[1] - start[1]}
            style={{
              fill: 'rgba(0,0,0,0)',
              strokeWidth: 5,
              cursor: 'e-resize'
            }}
            onMouseDown={e => this.startResize(e, 'right')}
          />
          <rect
            x={start[0]}
            y={end[1] - 10}
            width={end[0] - start[0]}
            height='20'
            style={{
              fill: 'rgba(0,0,0,0)',
              strokeWidth: 5,
              cursor: 's-resize'
            }}
            onMouseDown={e => this.startResize(e, 'bottom')}
          />
          <rect
            x={start[0] - 10}
            y={start[1]}
            width='20'
            height={end[1] - start[1]}
            style={{
              fill: 'rgba(0,0,0,0)',
              strokeWidth: 5,
              cursor: 'w-resize'
            }}
            onMouseDown={e => this.startResize(e, 'left')}
          />
        </g>
      </g>
    );
  }

  handleMouseEnter = () => {
    if (!this.state.isHover) {
      this.setState({ isHover: true });
    }
  };

  handleMouseLeave = () => {
    if (this.state.isHover) {
      this.setState({ isHover: false });
    }
  };

  handleDelete = e => {
    e.stopPropagation();
    e.preventDefault();
    const { onDelete, id } = this.props;
    onDelete(id);
  };

  creatingMouseMove = e => {
    const { movementX, movementY } = e;

    const { start, end } = this.props;
    this.props.onChange(
      start[0],
      start[1],
      end[0] + movementX,
      end[1] + movementY,
      this.props.id
    );
  };

  endCreating = () => {
    this.setState({
      isCreating: false
    });
  };

  onResize = e => {
    if (this.state.direction !== null) {
      const { start, end, onChange } = this.props;
      const { movementY, movementX } = e;
      switch (this.state.direction) {
        case 'top':
          onChange(
            start[0],
            start[1] + movementY,
            end[0],
            end[1],
            this.props.id
          );
          break;
        case 'right':
          onChange(
            start[0],
            start[1],
            end[0] + movementX,
            end[1],
            this.props.id
          );
          break;
        case 'bottom':
          onChange(
            start[0],
            start[1],
            end[0],
            end[1] + movementY,
            this.props.id
          );
          break;
        case 'left':
        default:
          onChange(
            start[0] + movementX,
            start[1],
            end[0],
            end[1],
            this.props.id
          );
      }
    }
  };

  startResize = (e, direction) => {
    e.stopPropagation();
    if (this.state.isCreating) {
      this.setState({ isCreating: false });
      document.body.removeEventListener('mousemove', this.creatingMouseMove);
      return;
    }
    this.setState({
      lastMouseX: e.pageX,
      lastMouseY: e.pageY,
      direction
    });
    document.body.addEventListener('mousemove', this.onResize);
  };

  endResize = e => {
    e.stopPropagation();
    this.setState({
      lastMouseX: null,
      lastMouseY: null,
      direction: null
    });
    document.body.removeEventListener('mousemove', this.onResize);
  };

  onMouseMove = e => {
    if (this.state.isDragging === true) {
      // const { movementX, movementY } = this.getDiff(e);
      const { movementX, movementY } = e;

      const { start, end } = this.props;
      this.props.onChange(
        start[0] + movementX,
        start[1] + movementY,
        end[0] + movementX,
        end[1] + movementY,
        this.props.id
      );
    }
  };

  handleMouseDown = e => {
    e.stopPropagation();
    if (this.state.isCreating) {
      this.setState({ isCreating: false });
      document.body.removeEventListener('mousemove', this.creatingMouseMove);
      return;
    }
    this.setState(
      {
        isDragging: true,
        lastMouseX: e.pageX,
        lastMouseY: e.pageY
      },
      () => document.body.addEventListener('mousemove', this.onMouseMove)
    );
  };

  handleMouseUp = e => {
    console.log(`⚡️: BoundingBox -> handleMouseUp`);
    e.stopPropagation();
    if (this.state.direction) {
      this.endResize(e);
    }

    if (this.state.isDragging) {
      this.setState(
        {
          isDragging: false,
          lastMouseX: null,
          lastMouseY: null
        },
        () => document.body.removeEventListener('mousemove', this.onMouseMove)
      );
    }
  };
}
