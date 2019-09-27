import React from 'react';
import guid from 'uniqid';
import './Segmentation.css';
import { BoundingBox } from '../BoundingBox/BoundingBox';
// task https://jsfiddle.net/vaoucptg/
// simple http://jsfiddle.net/d9BPz/546/
// https://medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d

// recent
// https://stackoverflow.com/questions/44748197/calculating-svg-bounding-rects-with-react
// https://engineering.datorama.com/mastering-drag-drop-using-reactjs-hooks-fb58dc1f816f
// https://engineering.datorama.com/mastering-drag-drop-with-reactjs-part-01-39bed3d40a03
// http://xahlee.info/js/svg_path_spec.html

// https://try.handl.ai/bounding-rects

/* Баги
1. нельзя увеличить размер за правый верхний край
2. при переходе из одной плоскости в другую по диагонали точка начала смещается
*/

class Segmentation extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      rects: [
        {
          start: [60, 60],
          end: [160, 110],
          id: '13123'
        }
      ],
      height: 0,
      width: 0,
      isMouseHover: false,
      image: 'https://try.handl.ai/static/demo/aabb/appartment.jpg'
    };
  }
  componentDidMount() {
    var img = new Image();
    img.onload = e => {
      const { width, height } = e.target;
      this.setState({
        width,
        height
      });
    };
    img.src = this.state.image;
  }

  render() {
    const { rects } = this.state;
    return (
      <div>
        <svg
          ref={this.myRef}
          width={this.state.width}
          height={this.state.height}
          style={{
            border: '1px solid #000',
            backgroundImage: `url("${this.state.image}")`,
            backgroundRepeat: 'no-repeat',
            maxWidth: '100%'
          }}
          onMouseDown={this.startBoundingBox}
          onMouseUp={this.endBoundingBox}
          onMouseMove={this.handleMouseMove}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          {rects.map(box => (
            <BoundingBox
              {...box}
              key={box.id}
              onChange={this.handleChange}
              onDelete={this.handleDelete}
            />
          ))}
        </svg>
        {/* <img src={this.state.image} alt="" /> */}
      </div>
    );
  }

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
    if (!this.state.isMouseHover) return;

    const { rects } = this.state;
    const foundBox = rects.find(box => box.id === id);
    const { width, height } = this.myRef.current.getBoundingClientRect();

    let start = [x, y];
    let end = [endX, endY];

    if (y <= 0 || endY >= height) {
      start = [x, foundBox.start[1]];
      end = [endX, foundBox.end[1]];
    }

    if (x <= 0 || endX >= width) {
      start = [foundBox.start[0], y];
      end = [foundBox.end[0], endY];
    }

    this.setState({
      rects: [
        ...rects.filter(box => box.id !== id),
        {
          ...foundBox,
          start,
          end
        }
      ]
    });
  };

  startBoundingBox = e => {
    const frameBoundingRect = this.myRef.current.getBoundingClientRect();
    const { rects } = this.state;
    this.setState({
      rects: [
        ...rects,
        {
          start: [e.clientX, e.clientY - frameBoundingRect.y],
          end: [e.clientX, e.clientY - frameBoundingRect.y],
          id: guid()
        }
      ]
    });
  };
}

export default Segmentation;

//   ReactDOM.render(<Segmentation />, document.querySelector("#app"))
