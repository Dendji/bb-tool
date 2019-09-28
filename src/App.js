import React from 'react';
import Segmentation from './components/Segmentation/Segmentation';
import './App.css';

const handleChange = result => console.log('result: ', result);
const imageUrl = 'https://try.handl.ai/static/demo/aabb/appartment.jpg';

function App() {
  return (
    <div
      className='App'
      style={{
        fontFamily: `'Lato',  Arial, Helvetica, sans-serif`,
        padding: '30px 50px',
        backgroundColor: '#8EC5FC',
        backgroundImage: 'linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)',
        height: '100vh',
        boxSizing: 'border-box',
        color: '#fff'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <header className='App-header' style={{ height: 100 }}>
            <h1
              style={{
                textAlign: 'center',
                color: '#fff',
                textShadow:
                  '-1px -1px 1px rgba(255,255,255,.1), 1px 1px 1px rgba(0,0,0,.15)'
              }}
            >
              Bounding Box Tool{' '}
              <span role='img' aria-label='BB'>
                🔱
              </span>
            </h1>
          </header>
          <div style={{ maxWidth: '100%', display: 'flex' }}>
            <div style={{ width: '70%' }}>
              <Segmentation onChange={handleChange} imageUrl={imageUrl} />
            </div>
            <h2
              style={{
                textAlign: 'left',
                marginLeft: '60px',
                width: '30%',
                position: 'relative',
                textShadow:
                  '-1px -1px 1px rgba(255,255,255,.1), 1px 1px 1px rgba(0,0,0,.15)'
              }}
            >
              <span style={{ position: 'absolute', top: '-30px' }}>👈</span>{' '}
              Mark any objects <br />
              you like in the image <br />
              and see result <br />
              in devtools console{' '}
            </h2>
          </div>
        </div>

        <footer style={{ textAlign: 'center' }}>
          By Denis Zuykov with <span>🖤</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
