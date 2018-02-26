// Activite_3.js

(function(ext) {
  var device = null;
  var _rxBuf = [];

  var moteurs = {
    M1:1,
    M2:2
  };

	var sens = {
		POSITIF:1,
		NEGATIF:0
	};

  var vitesses = {
    0:0,
    50:50,
    100:100,
    150:150,
    200:200,
    250:250
  };

  var vitesse_M1, vitesse_M2;

  //pins des moteurs tels que MX = [ENX,INX,INX]
  //var pins_M1 = [, , ];
  //var pins_M2 = [, , ];

  //Réinitialise les paramètres de la carte
  ext.resetAll = function(){
    device.send([0xff, 0x55, 2, 0, 4]);
  };

  //Fonction d'Initialisation de l'Arduino
  ext.runArduino = function(){
		responseValue();
	};

  //Fonction qui réinitialise toutes les valeurs à 0
  ext.arretUrgence = function(){
    for (var i = 2; i<=20; i++)
    {
      runPackage(30,i,0);
    }
  };

  //Fonction qui permet de démarrer le moteur sélectionné dans le sens séléctionné à la vitesse selctionné
	ext.demarrerMoteur = function(moteur_select,sens_select,vitesse_select) {

    if (moteurs[moteur_select] == 1) {

      runPackage(32,moteurs[moteur_select],vitesses[vitesse_select]);

      vitesse_M1 = vitesses[vitesse_select];

      if (sens[sens_select] == 1) {

      }else{

      }
    }

    if (moteurs[moteur_select] == 2) {

      runPackage(32,moteurs[moteur_select],vitesses[vitesse_select]);

      vitesse_M2 = vitesses[vitesse_select];

      if (sens[sens_select] == 1) {

      }else{

      }

    }
  };

  //Réinitialise la valeur de la PWM à 0
	ext.arreterMoteur = function(moteur_select){
    if (moteurs[moteur_select] == 1) {
    runPackage(32,moteurs[moteur_select],0);
    vitesse_M1 = 0;
    }

    if (moteurs[moteur_select] == 2) {
    runPackage(32,moteurs[moteur_select],0);
    vitesse_M2 = 0;
    }
  };

  //Augmente la PWM de 50 à chaque appuis
	ext.accelMoteur = function(moteur_select){
    if (moteurs[moteur_select] == 1) {

      if (vitesse_M1 < 250) {
        vitesse_M1 += 50;
        runPackage(32,moteurs[moteur_select],vitesse_M1);
      }else{
        runPackage(32,moteurs[moteur_select],250);
      }

    }

    if (moteurs[moteur_select] == 2) {

      if (vitesse_M2 < 250) {
        vitesse_M2 += 50;
        runPackage(32,moteurs[moteur_select],vitesse_M2);
      }else{
        runPackage(32,moteurs[moteur_select],250);
      }

    }
  };

  //Augmente la PWM de 50 à chaque appuis
  ext.ralentirMoteur = function(moteur_select){
    if (moteurs[moteur_select] == 1) {

      if (vitesse_M1 > 0) {
        vitesse_M1 -= 50;
        runPackage(32,moteurs[moteur_select],vitesse_M1);
      }else{
        runPackage(32,moteurs[moteur_select],0);
      }
    }

    if (moteurs[moteur_select] == 2) {

      if (vitesse_M2 > 0) {
        vitesse_M2 -= 50;
        runPackage(32,moteurs[moteur_select],vitesse_M2);
      }else{
        runPackage(32,moteurs[moteur_select],0);
      }

    }
  };

  //Fonction de tempo
  function waitMilliseconds(milliseconds) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > milliseconds){
				break;
			}
		}
	}

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

  function processData(bytes) {
      trace(bytes);
  }

  var inputArray = [];
  var _isParseStart = false;
  var _isParseStartIndex = 0;
  function processData(bytes) {
    var len = bytes.length;
    if(_rxBuf.length>30){
      _rxBuf = [];
    }
    for(var index=0;index<bytes.length;index++){
      var c = bytes[index];
      _rxBuf.push(c);
      if(_rxBuf.length>=2){
        if(_rxBuf[_rxBuf.length-1]==0x55 && _rxBuf[_rxBuf.length-2]==0xff){
          _isParseStart = true;
          _isParseStartIndex = _rxBuf.length-2;
        }
        if(_rxBuf[_rxBuf.length-1]==0xa && _rxBuf[_rxBuf.length-2]==0xd&&_isParseStart){
          _isParseStart = false;

          var position = _isParseStartIndex+2;
          var extId = _rxBuf[position];
          position++;
          var type = _rxBuf[position];
          position++;
          //1 byte 2 float 3 short 4 len+string 5 double
          var value;
          switch(type){
            case 1:{
              value = _rxBuf[position];
              position++;
            }
              break;
            case 2:{
              value = readFloat(_rxBuf,position);
              position+=4;
              if(value<-255||value>1023){
                value = 0;
              }
            }
              break;
            case 3:{
              value = readInt(_rxBuf,position,2);
              position+=2;
            }
              break;
            case 4:{
              var l = _rxBuf[position];
              position++;
              value = readString(_rxBuf,position,l);
            }
              break;
            case 5:{
              value = readDouble(_rxBuf,position);
              position+=4;
            }
              break;
            case 6:
              value = readInt(_rxBuf,position,4);
              position+=4;
              break;
          }
          if(type<=6){
            responseValue(extId,value);
          }else{
            responseValue();
          }
          _rxBuf = [];
        }
      }
    }
    }

  function readFloat(arr,position){
    var f= [arr[position],arr[position+1],arr[position+2],arr[position+3]];
    return parseFloat(f);
  }

  function readInt(arr,position,count){
    var result = 0;
    for(var i=0; i<count; ++i){
      result |= arr[position+i] << (i << 3);
    }
    return result;
  }

  function readDouble(arr,position){
    return readFloat(arr,position);
  }

  function readString(arr,position,len){
    var value = "";
    for(var ii=0;ii<len;ii++){
      value += String.fromCharCode(_rxBuf[ii+position]);
    }
    return value;
  }

  function appendBuffer( buffer1, buffer2 ) {
      return buffer1.concat( buffer2 );
  }

  //---- Fonctions officielles pour les extensions mBlock ----//

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
      device.set_receive_handler('Activite_3',function(data) {
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
      if(!device) return {status: 1, msg: 'Extension Activite_3 déconnectée'};
      return {status: 2, msg: 'Extension Activite_3 connectée'};
  };

  var descriptor = {};

	ScratchExtensions.register('Activite_3', descriptor, ext, {type: 'serial'});
})({});
