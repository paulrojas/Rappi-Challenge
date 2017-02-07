
var APP = {

  Player: function () {

    var scope = this;

    var loader = new THREE.ObjectLoader();
    var camera, scene, renderer, N=4;
    var controls, effect, cameraVR, isVR;
    var events = {};
    this.dom = document.getElementById( 'scene' );

    this.width = this.dom.clientWidth;
    this.height = this.dom.clientHeight;

    this.load = function ( json ) {
      isVR = json.project.vr;

      renderer = new THREE.WebGLRenderer( { alpha: true, antialias: true, canvas: this.dom } );
      renderer.setClearColor( 0xf0f0f0 );
      renderer.setPixelRatio( window.devicePixelRatio );

      if ( json.project.gammaInput ) renderer.gammaInput = true;
      if ( json.project.gammaOutput ) renderer.gammaOutput = true;

      if ( json.project.shadows ) {
        renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      //this.dom.appendChild( renderer.domElement );

      this.setScene( loader.parse( json.scene ) );
      this.setCamera( loader.parse( json.camera ) );
      this.initGui();

      scene.background = new THREE.Color( 0xf0f0f0 );

      controls = new THREE.TrackballControls( camera );
      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controls.noZoom = false;
      controls.noPan = false;
      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;
      controls.keys = [ 65, 83, 68 ];
      controls.addEventListener( 'change', renderer );

      events = {
        init: [],
        start: [],
        stop: [],
        keydown: [],
        keyup: [],
        mousedown: [],
        mouseup: [],
        mousemove: [],
        touchstart: [],
        touchend: [],
        touchmove: [],
        update: []
      };
      
      var box = scene.getObjectByName( 'Box' );
      box.material.roughnessMap.magFilter = THREE.NearestFilter;
      box.scale.multiplyScalar( 0.85 );
      scene.remove( box );

      var group = new THREE.Group();
      scene.add( group );

      for ( var x = 0; x < N; x++ ) {
        for ( var y = 0; y < N; y++ ) {
          for ( var z = 0; z < N; z++ ) {
            var clone = box.clone();
            clone.material = box.material.clone();
            clone.position.x = x * 2 - 5.5;
            clone.position.y = y * 2 - 5.5;
            clone.position.z = z * 2 - 5.5;
            group.add( clone );
          }
        }
      }      
      dispatch( events.init, arguments );
    };

    this.setCamera = function ( value ) {
      camera = value;
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();
    };

    this.setScene = function ( value ) {
      scene = value;
    };

    this.setSize = function ( width, height ) {
      this.width = width;
      this.height = height;

      if ( camera ) {
        camera.aspect = this.width / this.height;
        camera.updateProjectionMatrix();
      }

      if ( renderer ) {
        renderer.setSize( width, height );
      }
    };

    function dispatch( array, event ) {
      for ( var i = 0, l = array.length; i < l; i ++ ) {
        array[ i ]( event );
      }
    }

    var prevTime, request;

    function animate( time ) {
      request = requestAnimationFrame( animate );

      try {
        dispatch( events.update, { time: time, delta: time - prevTime } );
      } catch ( e ) {
        console.error( ( e.message || e ), ( e.stack || "" ) );
      }

      renderer.render( scene, camera );
      try {
        controls.update();
      } catch(ex) {

      }
      
      prevTime = time;
    }

    this.play = function () {
      document.addEventListener( 'keydown', onDocumentKeyDown );
      document.addEventListener( 'keyup', onDocumentKeyUp );
      document.addEventListener( 'mousedown', onDocumentMouseDown );
      document.addEventListener( 'mouseup', onDocumentMouseUp );
      document.addEventListener( 'mousemove', onDocumentMouseMove );
      document.addEventListener( 'touchstart', onDocumentTouchStart );
      document.addEventListener( 'touchend', onDocumentTouchEnd );
      document.addEventListener( 'touchmove', onDocumentTouchMove );

      dispatch( events.start, arguments );

      request = requestAnimationFrame( animate );
      prevTime = performance.now();
    };

    this.stop = function () {
      document.removeEventListener( 'keydown', onDocumentKeyDown );
      document.removeEventListener( 'keyup', onDocumentKeyUp );
      document.removeEventListener( 'mousedown', onDocumentMouseDown );
      document.removeEventListener( 'mouseup', onDocumentMouseUp );
      document.removeEventListener( 'mousemove', onDocumentMouseMove );
      document.removeEventListener( 'touchstart', onDocumentTouchStart );
      document.removeEventListener( 'touchend', onDocumentTouchEnd );
      document.removeEventListener( 'touchmove', onDocumentTouchMove );

      dispatch( events.stop, arguments );
      cancelAnimationFrame( request );
    };

    this.dispose = function () {
      while ( this.dom.children.length ) {
        this.dom.removeChild( this.dom.firstChild );
      }
      renderer.dispose();
      camera = undefined;
      scene = undefined;
      renderer = undefined;
    };

    this.initGui = function() {
      var gui = new dat.GUI( { width: 280 } );
      var inputs = new function () {
        this.rotationSpeed = 0.02;
        this.bouncingSpeed = 0.03;
      };
      gui.add(inputs, 'rotationSpeed', 0, 0.5);
      gui.add(inputs, 'bouncingSpeed', 0, 0.5);

      var api = {
        'mode': 0,
        'transparent_objects': false
      };

      var folder = gui.addFolder( 'menu' );

      folder.add( api, 'mode', {

        'classic': 0,
        'light pre-pass': 1,
        'forward': 2

      } ).onChange( function() {

        switch( parseInt( api.mode ) ) {

          case 0:
            renderer.forwardRendering = false;
            renderer.enableLightPrePass( false );
            break;

          case 1:
            renderer.forwardRendering = false;
            renderer.enableLightPrePass( true );
            break;

          case 2:
            renderer.forwardRendering = true;
            break;

          default:
            break;

        }

      } );

      folder.add( api, 'transparent_objects' ).onChange( function () {

        for ( var i = 0, il = transparentObjects.length; i < il; i ++ ) {

          transparentObjects[ i ].visible = api[ 'transparent_objects' ];

        }

      } );

      folder.open();

    }

    function onDocumentKeyDown( event ) {
      dispatch( events.keydown, event );
    }

    function onDocumentKeyUp( event ) {
      dispatch( events.keyup, event );
    }

    function onDocumentMouseDown( event ) {
      dispatch( events.mousedown, event );
    }

    function onDocumentMouseUp( event ) {
      dispatch( events.mouseup, event );
    }

    function onDocumentMouseMove( event ) {
      dispatch( events.mousemove, event );
    }

    function onDocumentTouchStart( event ) {
      dispatch( events.touchstart, event );
    }

    function onDocumentTouchEnd( event ) {
      dispatch( events.touchend, event );
    }

    function onDocumentTouchMove( event ) {
      dispatch( events.touchmove, event );
    }
  }
};
