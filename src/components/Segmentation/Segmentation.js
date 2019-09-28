import React from 'react';
import guid from 'uniqid';
import './Segmentation.css';
import { BoundingBox } from '../BoundingBox/BoundingBox';
import _ from 'lodash';
import PropTypes from 'prop-types';

// task https://jsfiddle.net/vaoucptg/
// simple http://jsfiddle.net/d9BPz/546/
// https://medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d

// recent
// https://stackoverflow.com/questions/44748197/calculating-svgRef-bounding-rects-with-react
// https://engineering.datorama.com/mastering-drag-drop-using-reactjs-hooks-fb58dc1f816f
// https://engineering.datorama.com/mastering-drag-drop-with-reactjs-part-01-39bed3d40a03
// http://xahlee.info/js/svg_path_spec.html

// https://try.handl.ai/bounding-rects

/* Баги
1. нельзя увеличить размер за правый верхний край
2. при переходе из одной плоскости в другую по диагонали точка начала смещается
*/

class Segmentation extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    imageUrl: PropTypes.string.isRequired
  };

  minimalRectSize = 50;

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

  handleResize = e => {
    const currentWidth = this.svgRef.current.getBoundingClientRect().width;
    const { ratio } = this.state;
    this.setState({
      currentHeight: currentWidth * ratio
    });
  };

  scaleAdjusted = rects => {
    const coeff = this.getScaleCoefficient();

    return rects.map(rect => {
      return {
        ...rect,
        start: rect.start.map(c => c * coeff),
        end: rect.end.map(c => c * coeff)
      };
    });
  };

  getScaleCoefficient = () => {
    const currentWidth = this.svgRef.current.getBoundingClientRect().width;
    const { imageOriginalWidth } = this.state;
    return currentWidth / imageOriginalWidth;
  };

  render() {
    const { rects } = this.state;
    const adjusted = this.svgRef.current ? this.scaleAdjusted(rects) : rects;
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
    const newRect = this.setRectMinimalSize(rects.find(rect => rect.isNew));

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

  setRectMinimalSize = rect => {
    const { start, end } = rect;
    console.log(`⚡️: Segmentation -> start, end`, start, end);
    if (Math.abs(start[0] - end[0]) < this.minimalRectSize) {
      end[0] = start[0] + this.minimalRectSize;
    }

    if (Math.abs(start[1] - end[1]) < this.minimalRectSize) {
      end[1] = start[1] + this.minimalRectSize;
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

      const { rects } = this.state;
      const newRect = rects.find(rect => rect.isNew);

      this.setState({
        rects: [
          ...rects.filter(rect => !rect.isNew),
          {
            ...newRect,
            end: [newRect.end[0] + movementX, newRect.end[1] + movementY]
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
    this.setState({
      isCreatingNew: true,
      rects: [
        ...rects,
        {
          start: [
            e.clientX - frameBoundingRect.x,
            e.clientY - frameBoundingRect.y
          ],
          end: [
            e.clientX - frameBoundingRect.x,
            e.clientY - frameBoundingRect.y
          ],
          isNew: true,
          id: guid()
        }
      ]
    });
  };

  handleDelete = id => {
    this.setState({
      rects: this.state.rects.filter(rect => rect.id !== id)
    });
  };

  handleMouseLeave = () => {
    this.setState({ isMouseHover: false });
  };

  handleMouseEnter = () => {
    this.setState({ isMouseHover: true });
  };

  handleChange = (x, y, endX, endY, id) => {
    const coeff = this.getScaleCoefficient();
    x = (x * 1) / coeff;
    y = (y * 1) / coeff;
    endX = (endX * 1) / coeff;
    endY = (endY * 1) / coeff;

    if (!this.state.isMouseHover) return;

    const { rects } = this.state;
    const foundBox = rects.find(box => box.id === id);
    const { width, height } = this.svgRef.current.getBoundingClientRect();

    let start = [x, y];
    let end = [endX, endY];

    if (y <= 0 || endY >= height) {
      start = [x, foundBox.start[1]];
      end = [endX, foundBox.end[1]];
    }

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

//   ReactDOM.render(<Segmentation />, document.querySelector("#app"))
