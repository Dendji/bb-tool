import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class BoundingBox extends Component {
  static propTypes = {
    start: PropTypes.array.isRequired,
    end: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    isNew: PropTypes.bool
  };

  state = {
    isDragging: false,
    direction: null
  };

  render() {
    const { start, end, isNew } = this.props;
    const lastCoord = start[0] - end[0];

    // using path for future bounging box scalling
    return (
      <g>
        <defs>
          <linearGradient id='Gradient' x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0%' stopColor='#FEE140' />
            <stop offset='100%' stopColor='#FA709A' />
          </linearGradient>
        </defs>
        <path
          d={`m ${start[0]} ${start[1]} l ${end[0] - start[0]} 0 l 0 ${end[1] -
            start[1]} l ${lastCoord} 0 z`}
          style={{
            stroke: '#FEE140',
            fill: 'url(#Gradient)',
            backgroundColor: '#8EC5FC',
            fillOpacity: '0.6',
            strokeWidth: '1'
          }}
          onMouseDown={this.startDragging}
          onClick={this.handleClick}
          onMouseOver={this.handleMouseEnter}
          onMouseOut={this.handleMouseLeave}
        />

        <g>
          {!isNew && this.renderDeleteButton(start, end)}
          {!isNew && this.renderResizers(start, end)}
        </g>
      </g>
    );
  }

  renderResizers = (start, end) => {
    const areaSize = 20;

    return (
      <>
        <rect
          x={start[0]}
          y={start[1] - 10}
          width={end[0] - start[0]}
          height={areaSize}
          fill={'rgba(0,0,0,0)'}
          style={{
            cursor: 'n-resize'
          }}
          onMouseDown={e => this.startResize(e, 'top')}
        />
        <rect
          x={end[0] - 10}
          y={start[1]}
          width={areaSize}
          height={end[1] - start[1]}
          fill={'rgba(0,0,0,0)'}
          style={{
            cursor: 'e-resize'
          }}
          onMouseDown={e => this.startResize(e, 'right')}
        />
        <rect
          x={start[0]}
          y={end[1] - 10}
          width={end[0] - start[0]}
          height={areaSize}
          fill={'rgba(0,0,0,0)'}
          style={{
            cursor: 's-resize'
          }}
          onMouseDown={e => this.startResize(e, 'bottom')}
        />
        <rect
          x={start[0] - 10}
          y={start[1]}
          width={areaSize}
          fill={'rgba(0,0,0,0)'}
          height={end[1] - start[1]}
          style={{
            cursor: 'w-resize'
          }}
          onMouseDown={e => this.startResize(e, 'left')}
        />
      </>
    );
  };

  renderDeleteButton = (start, end) => (
    <text
      x={start[0] + Math.abs(end[0] - start[0]) / 2 - 5}
      y={start[1] + Math.abs(end[1] - start[1]) / 2 + 5}
      style={{
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
      fill='#FFF'
      onClick={this.handleDelete}
      onMouseDown={this.handleDeleteMouseDown}
    >
      ✕
    </text>
  );

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  handleDelete = e => {
    e.stopPropagation();
    const { onDelete, id } = this.props;
    onDelete(id);
  };

  handleDeleteMouseDown = e => e.stopPropagation();

  onResize = e => {
    const { direction } = this.state;
    if (direction !== null) {
      const { start, end, onChange } = this.props;
      const { movementY, movementX } = e;

      switch (direction) {
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
    this.setState({
      direction
    });
    document.body.addEventListener('mousemove', this.onResize);
  };

  endResize = e => {
    e.stopPropagation();
    this.setState({
      direction: null
    });
    document.body.removeEventListener('mousemove', this.onResize);
  };

  onMouseMove = e => {
    const { isDragging } = this.state;
    if (isDragging) {
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

  startDragging = e => {
    e.stopPropagation();
    document.body.addEventListener('mousemove', this.onMouseMove);
    this.setState({
      isDragging: true
    });
  };

  handleMouseUp = e => {
    const { direction, isDragging } = this.state;

    if (direction) {
      this.endResize(e);
    }

    if (isDragging) {
      this.endDragging();
    }
  };

  endDragging = () => {
    document.body.removeEventListener('mousemove', this.onMouseMove);
    this.setState({
      isDragging: false
    });
  };
}
