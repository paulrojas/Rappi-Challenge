var GUIParams = function() {
  this.N = 4;
  this.x = 1;
  this.y = 1;
  this.z = 1;
  this.W = 0;
  this.x1 = 1;
  this.y1 = 1;
  this.z1 = 1;
  this.x2 = 1;
  this.y2 = 1;
  this.z2 = 1;
  this.updateValue = function(){
    player.elements[this.x][this.y][this.z].value = this.W;
    player.elements[this.x][this.y][this.z].box.material.emissive.setHex( 0x00ffff );
  };
  this.queryValue = function() {

  }
};

var gui, param;

var APP = {

  Player: function () {

    var scope = this;

    var loader = new THREE.ObjectLoader();
    var camera, scene, renderer, N=4;
    var controls, effect, raycaster;
    var mouse = new THREE.Vector2(), INTERSECTED;
    var events = {};
    this.dom = document.getElementById( 'scene' );
    this.elements = [];
    var group, box;

    this.width = this.dom.clientWidth;
    this.height = this.dom.clientHeight;

    this.load = function ( json ) {
      renderer = new THREE.WebGLRenderer( { alpha: true, antialias: true, canvas: this.dom } );
      renderer.setClearColor( 0xf0f0f0, 1 );
      renderer.setPixelRatio( window.devicePixelRatio );

      if ( json.project.gammaInput ) renderer.gammaInput = true;
      if ( json.project.gammaOutput ) renderer.gammaOutput = true;

      if ( json.project.shadows ) {
        renderer.shadowMap.enabled = true;
      }

      this.setScene( loader.parse( json.scene ) );
      this.setCamera( loader.parse( json.camera ) );

      scene.background = new THREE.Color( 0xf0f0f0 );
      raycaster = new THREE.Raycaster();

      controls = new THREE.TrackballControls( camera, this.dom );
      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controls.noZoom = false;
      controls.noPan = false;
      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;
      controls.keys = [ 65, 83, 68 ];

      camera.position.x = 14.727889988750304;
      camera.position.y = -0.6378274967080255;
      camera.position.z = 8.070858033471538;

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
      
      box = scene.getObjectByName( 'Box' );
      box.material.roughnessMap.magFilter = THREE.NearestFilter;
      box.scale.multiplyScalar( 0.85 );
      scene.remove( box );

      this.changeMatrixSize();

      dispatch( events.init, arguments );
    };

    this.setCamera = function ( value ) {
      camera = value;
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();
    };

    this.setScene = function ( value ) {
      scene = value;
      scene.background = new THREE.Color( 0xf0f0f0 );
      var light = new THREE.AmbientLight( 0x404040 ); // soft white light
      scene.add( light );
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

    this.setGUI = function() {
      gui = new dat.GUI();

      param = new GUIParams();
      var f1 = gui.addFolder('Tamaño del cubo');
      f1.add(param, 'N').min(2).max(20).step(1).onFinishChange( function(value){
        if (N != value) {
          if (confirm('Esta seguro de cambiar el tamaño del cubo. Si continúa se eliminarán todos los valores.')) {
            N = value;
            scope.changeMatrixSize();
          } else {
            param.N = N;
            value = N;
          }
        }
      }).listen();

      var f2 = gui.addFolder('Update');
      f2.add(param, 'x').min(1).max(N).step(1);
      f2.add(param, 'y').min(1).max(N).step(1);
      f2.add(param, 'z').min(1).max(N).step(1);
      f2.add(param, 'W').min(0).max(1000).step(1);
      f2.add(param, 'updateValue').name('Actualizar elemento');

      var f3 = gui.addFolder('Query');
      f3.add(param, 'x1');
      f3.add(param, 'y1');
      f3.add(param, 'z1');
      f3.add(param, 'x2');
      f3.add(param, 'y2');
      f3.add(param, 'z2');
    }

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
  
      raycaster.setFromCamera( mouse, camera );
      var intersects = raycaster.intersectObjects( group.children );
      if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
          if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

          INTERSECTED = intersects[ 0 ].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          INTERSECTED.material.emissive.setHex( 0xff0000 );
          document.getElementById("X").innerText = INTERSECTED['tag'].x;
          document.getElementById("Y").innerText = INTERSECTED['tag'].y;
          document.getElementById("Z").innerText = INTERSECTED['tag'].z;
          document.getElementById("W").innerText = scope.elements[INTERSECTED['tag'].x][INTERSECTED['tag'].y][INTERSECTED['tag'].z].value;
        }
      } else {
        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;
      }
      try {
        controls.update();
      } catch (ex) { 

      }

      //Actuliza los valores de los parametros
      if (gui != undefined) {
        for (var i in gui.__controllers) {
          gui.__controllers[i].updateDisplay();
        }      
      }

      renderer.render( scene, camera );
      prevTime = time;
    }

    this.play = function () {
      document.addEventListener( 'mousemove', onDocumentMouseMove );

      dispatch( events.start, arguments );

      request = requestAnimationFrame( animate );
      prevTime = performance.now();
    };

    this.stop = function () {
      document.removeEventListener( 'mousemove', onDocumentMouseMove );

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

    this.changeMatrixSize = function() {
      if ( group != undefined ) scene.remove( group );

      group = new THREE.Group();
      scene.add( group );
      this.elements = [];

      for ( var x = 1; x <= N; x++ ) {
        this.elements[x] = [];
        for ( var y = 1; y <= N; y++ ) {
          this.elements[x][y] = [];
          for ( var z = 1; z <= N; z++ ) {
            var clone = box.clone();
            clone.material = box.material.clone();
            clone.position.x = (x-1) * 2;
            clone.position.y = -(y-1) * 2;
            clone.position.z = -(z-1) * 2;
            clone['tag'] = { x: x, y: y, z: z }
            this.elements[x][y][z] = { box: clone, value: 0 };
            group.add( this.elements[x][y][z].box );
          }
        }
      }
      this.elements[1][1][1].box.material.emissive.setHex( 0x00ff00 );
      this.elements[N][N][N].box.material.emissive.setHex( 0x0000ff );
      camera.position.x = this.elements[N][1][1].box.position.x * 2;
      camera.position.z = this.elements[N][1][1].box.position.x * 2.25;
      camera.position.y = -(this.elements[N][1][1].box.position.x/2)*1.45;
      camera.lookAt( this.elements[N][1][1].box.position );
    }

    function onDocumentMouseMove( event ) {
      event.preventDefault();
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      dispatch( events.mousemove, event );
    }
  }
};
