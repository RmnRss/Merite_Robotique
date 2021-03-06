// pilotageft.js

(function(ext) {
  var device = null;

  var couleurs = {
    verte:2,
		jaune:3,
		rouge:4
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
    for (var i = 2; i<=4; i++)
    {
      runPackage(30,i,0);
    }
  };

  //Fonction qui permet de d'allumer la LED de couleur choisie
	ext.LED_ON = function(couleur_select) {
    runPackage(30,couleurs[couleur_select],1);
  };

  //Fonction qui permet de d'éteindre la LED de couleur choisie
	ext.LED_OFF = function(couleur_select){
    runPackage(30,couleurs[couleur_select],0);
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
      device.set_receive_handler('Activite_1',function(data) {
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
      if(!device) return {status: 1, msg: 'Extension Activite_1 déconnectée'};
      return {status: 2, msg: 'Extension Activite_1 connectée'};
  };

  var descriptor = {};

	ScratchExtensions.register('Activite_1', descriptor, ext, {type: 'serial'});
})({});
