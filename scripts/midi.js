/**
 * message.data = Uint8Array containing the data bytes of a single MIDI message
 * midi specs: midi.org/specifications-old/item/table-1-summary-of-midi-message
 * 
 * values in decimal by default, convert to hex when referencing specs
 * 
 * message.data[0]: status/event (e.g. 144:note on, 128:note off)
 * 
 * data[1,2] content/formats depends on the event
 * some events won't return data[2] at all (e.g. 208:after-touch, only returns pressure value)
 * 
 * when data[0] = 144 || 128:
 * message.data[1]: note number
 * message.data[2]: velocity 0-127
 * 
 * other data[0] values:
 * 248: Timing Clock. Sent 24 times per quarter note
 * 254: Active Sensing. Sent repeatedly to tell the receiver that connection is alive
 * 
 * For my own keyboard, middle C is note 60- this demo utilizes 2 octaves
 * 
 */

function pressNote(midiArray){
    var target = document.getElementById('n' + midiArray[1]);
    switch (midiArray[2]) {
        case 0:
            target.style = "";
            break;
        default:
            target.style = "background:" + "blue;";
    }
}

 navigator.requestMIDIAccess().then(function(access) {
    let inputs = access.inputs;
    let midiCache = 0;
    inputs.forEach((input) => {
        input.onmidimessage = function(message) {
            // Log events with note values, only log 1 event per note
            while(message.data[1] && message.data != midiCache){
                pressNote(message.data);                
                midiCache = message.data;
                console.log(message.data);
            }
        }
    });
    access.onstatechange = function(e) {
       // Print information about the (dis)connected MIDI controller
       console.log(e.port.name, e.port.manufacturer, e.port.state);
    };
});