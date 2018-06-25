import React, {Component} from 'react';

class OthelloDuo extends Component{
    constructor(props) {
        super(props);
      }

      render() {
        return (
          <div id="particles-js">
            <script>
              {particlesJS.load('particles-js', 'particles.json', function() {
                console.log('callback - particles-js config loaded');
              })}
            </script>
            <div>2</div>
          </div>
        );
      }
}

export default OthelloDuo;