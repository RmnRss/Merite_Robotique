// pilotageft.js

(function(ext) {
  var device = null;

  var list_LED = {
    2:2,
		3:3,
		4:4,
    5:5,
    6:6,
    7:7,
    8:8,
    9:9
  };

  ext.resetAll = function(){
    device.send([0xff, 0x55, 2, 0, 4]);
  };

  //Fonction d'Initialisation de l'Arduino
  ext.runArduino = function(){
		responseValue();
	};

  //Fonction qui réinitialise toutes les valeurs à 0
  ext.arretUrgence = function(){
    for (var i = 2; i<=9; i++)
    {
      runPackage(30,i,0);
    }
  };

  //Fonction qui permet de d'allumer la LED choisie
	ext.LED_ON = function(LED_select) {
    runPackage(30,list_LED[LED_select],1);
  };

  //Fonction qui permet de d'éteindre la LED choisie
	ext.LED_OFF = function(LED_select){
    runPackage(30,list_LED[LED_select],0);
  };

  //---- Fonctions de transmissions des données vers l'Arduino. ----//

  function sendPackage(argList, type){
    var bytes = [0xff, 0x55, 0, 0, type];
    for(var i=0;i<argList.length;++i){
      var val = argList[i];
      if(val.constructor == "[class Array]"){
        bytes = bytes.concat(val);
      }else{
        bytes.push(val);
      }
    }
    bytes[2] = bytes.length - 3;
    device.send(bytes);
  }

  function runPackage(){
    sendPackage(arguments, 2);
  }

  function getPackage(){
    var nextID = arguments[0];
    Array.prototype.shift.call(arguments);
    sendPackage(arguments, 1);
  }

  //---- Fonctions officielles pour les extensions mBlock ----//

  function processData(bytes) {
      trace(bytes);
  }

  // Extension API interactions
  var potentialDevices = [];
  ext._deviceConnected = function(dev) {
      potentialDevices.push(dev);

      if (!device) {
          tryNextDevice();
      }
  };

  function tryNextDevice() {
      // If potentialDevices is empty, device will be undefined.
      // That will get us back here next time a device is connected.
      device = potentialDevices.shift();
      if (device) {
          device.open({ stopBits: 0, bitRate: 115200, ctsFlowControl: 0 }, deviceOpened);
      }
  }

  function deviceOpened(dev) {
      if (!dev) {
          // Opening the port failed.
          tryNextDevice();
          return;
      }
      device.set_receive_handler('Acitivite_2',function(data) {
          processData(data);
      });
  };

  ext._deviceRemoved = function(dev) {
      if(device != dev) return;
      device = null;
  };

  ext._shutdown = function() {
      if(device) device.close();
      device = null;
  };

  ext._getStatus = function() {
      if(!device) return {status: 1, msg: 'Extension Activite_2 déconnectée'};
      return {status: 2, msg: 'Extension Activite_2 connectée'};
  };

  var descriptor = {};

	ScratchExtensions.register('Activite_2', descriptor, ext, {type: 'serial'});
})({});
