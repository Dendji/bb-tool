import React from 'react';
import guid from 'uniqid';
import { BoundingBox } from '../BoundingBox/BoundingBox';
import _ from 'lodash';
import PropTypes from 'prop-types';

const minimumRectSize = 50;

class Segmentation extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    imageUrl: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.onChange = _.debounce(this.onChange, 400);
    this.state = {
      rects: [
        {
          start: [299, 84],
          end: [407, 194],
          id: guid()
        }
      ],
      imageOriginalWidth: 0,
      isMouseHover: false,
      isCreatingNew: false
    };
  }

  componentDidMount() {
    var img = new Image();
    img.onload = e => {
      const { width, height } = e.target;
      const ratio = height / width;
      const currentWidth = this.svgRef.current.getBoundingClientRect().width;

      this.setState({
        imageOriginalWidth: width,
        ratio,
        currentHeight: currentWidth * ratio
      });
    };

    img.src = this.props.imageUrl;
    window.addEventListener('resize', _.throttle(this.handleResize, 500));
  }

  componentWillUnmount() {
    document.body.removeEventListener('mousedown', this.startBoundingBox);
    window.removeEventListener('resize', _.throttle(this.handleResize, 500));
  }

  formatCoordinates = rects => {
    // SVG origin (0,0 point) of coordinate system is top left corner
    // but we need origin at bottom left corner, so we need reverse Y coordinate
    const maxY = this.svgRef.current.getBoundingClientRect().height;
    return rects.map(rect => {
      const { start, end } = rect;
      return [[start[0], maxY - start[1]], [end[0], maxY - end[1]]];
    });
  };

  onChange = () => {
    const { onChange } = this.props;
    const { rects } = this.state;
    const formatted = this.formatCoordinates(rects);
    onChange(formatted);
  };

  handleResize = e => {
    const currentWidth = this.svgRef.current.getBoundingClientRect().width;
    const { ratio } = this.state;
    this.setState({
      currentHeight: currentWidth * ratio
    });
  };

  getScaleAdjustedRects = rects => {
    const coeff = this.getScaleCoefficient();

    return rects.map(rect => ({
      ...rect,
      start: rect.start.map(c => c * coeff),
      end: rect.end.map(c => c * coeff)
    }));
  };

  getScaleCoefficient = () => {
    const currentWidth = this.svgRef.current.getBoundingClientRect().width;
    const { imageOriginalWidth } = this.state;
    return currentWidth / imageOriginalWidth;
  };

  render() {
    const { rects } = this.state;
    const adjusted = this.svgRef.current
      ? this.getScaleAdjustedRects(rects)
      : rects;
    return (
      <div>
        <svg
          ref={this.svgRef}
          height={this.state.currentHeight}
          width='100%'
          style={{
            backgroundImage: `url("${this.props.imageUrl}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            maxWidth: '100%'
          }}
          onMouseDown={this.startBoundingBox}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          {adjusted.map(box => (
            <BoundingBox
              {...box}
              key={box.id}
              onChange={this.handleChange}
              onDelete={this.handleDelete}
            />
          ))}
        </svg>
      </div>
    );
  }

  endBoundingBox = e => {
    const { onChange } = this;
    document.removeEventListener('mouseup', this.endBoundingBox);
    document.removeEventListener('mousemove', this.handleMouseMove);

    const { rects } = this.state;
    const newRect = this.setRectMinimumSize(rects.find(rect => rect.isNew));

    this.setState(
      {
        isCreatingNew: false,
        rects: [
          ...rects.filter(rect => !rect.isNew),
          {
            ...newRect,
            isNew: false
          }
        ]
      },
      () => onChange(this.state.rects)
    );
  };

  setRectMinimumSize = rect => {
    const { start, end } = rect;

    if (Math.abs(start[0] - end[0]) < minimumRectSize) {
      end[0] = start[0] + minimumRectSize;
    }

    if (Math.abs(start[1] - end[1]) < minimumRectSize) {
      end[1] = start[1] + minimumRectSize;
    }

    return {
      ...rect,
      start: [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
      end: [Math.max(start[0], end[0]), Math.max(start[1], end[1])]
    };
  };

  handleMouseMove = e => {
    if (this.state.isCreatingNew && this.state.isMouseHover) {
      const { movementX, movementY } = e;
      const coeff = this.getScaleCoefficient();
      const { rects } = this.state;
      const newRect = rects.find(rect => rect.isNew);

      this.setState({
        rects: [
          ...rects.filter(rect => !rect.isNew),
          {
            ...newRect,
            end: [
              newRect.end[0] + movementX / coeff,
              newRect.end[1] + movementY / coeff
            ]
          }
        ]
      });
    }
  };

  startBoundingBox = e => {
    document.addEventListener('mouseup', this.endBoundingBox);
    document.addEventListener('mousemove', this.handleMouseMove);

    const frameBoundingRect = this.svgRef.current.getBoundingClientRect();
    const { rects } = this.state;
    const coeff = this.getScaleCoefficient();

    this.setState({
      isCreatingNew: true,
      rects: [
        ...rects,
        {
          start: [
            (e.clientX - frameBoundingRect.x) / coeff,
            (e.clientY - frameBoundingRect.y) / coeff
          ],
          end: [
            (e.clientX - frameBoundingRect.x) / coeff,
            (e.clientY - frameBoundingRect.y) / coeff
          ],
          isNew: true,
          id: guid()
        }
      ]
    });
  };

  handleDelete = id => {
    this.setState(
      {
        rects: this.state.rects.filter(rect => rect.id !== id)
      },
      () => this.onChange()
    );
  };

  handleMouseLeave = () => this.setState({ isMouseHover: false });

  handleMouseEnter = () => this.setState({ isMouseHover: true });

  handleChange = (x, y, endX, endY, id) => {
    const coeff = this.getScaleCoefficient();
    x = (x * 1) / coeff;
    y = (y * 1) / coeff;
    endX = (endX * 1) / coeff;
    endY = (endY * 1) / coeff;

    if (!this.state.isMouseHover) return;

    const { rects } = this.state;
    const foundBox = rects.find(box => box.id === id);
    let { width, height } = this.svgRef.current.getBoundingClientRect();

    width = width / coeff;
    height = height / coeff;
    let start = [x, y];
    let end = [endX, endY];

    // checking svg borders on the y-axis
    if (y <= 0 || endY >= height) {
      start = [x, foundBox.start[1]];
      end = [endX, foundBox.end[1]];
    }

    // checking svg borders on the x-axis
    if (x < 0 || endX > width) {
      start = [foundBox.start[0], y];
      end = [foundBox.end[0], endY];
    }

    this.setState(
      {
        rects: [
          ...rects.filter(box => box.id !== id),
          {
            ...foundBox,
            start,
            end
          }
        ]
      },
      () => this.onChange()
    );
  };
}

export default Segmentation;
