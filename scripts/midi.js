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


function midiNoteToFrequency (note) {
    return Math.pow(2, ((note - 69) / 12)) * 440;
}

let context = new AudioContext(),
oscillators = {};

function pressNote(midiArray){
    let target = document.getElementById('n' + midiArray[1]);
    switch (midiArray[2]) {
        case 0:
            target.style = "";
            break;
        default:
            target.style = "background:" + "blue;";
    }
}

function playNote (frequency,type) {
    oscillators[frequency] = context.createOscillator();
    oscillators[frequency].type = type;
    oscillators[frequency].frequency.value = frequency;
    oscillators[frequency].connect(context.destination);
    oscillators[frequency].start(context.currentTime);
}
 
function stopNote (frequency) {
    oscillators[frequency].stop(context.currentTime);
    oscillators[frequency].disconnect();
}
let wav = ['sine', 'square', 'sawtooth', 'triangle'];
let pb = [1, 1.5, 0.75, 2, 0.5, 1.26, 0.79];

function makeSynth(){
    let type1 = document.getElementById('osc1-type').value;
    let type2 = document.getElementById('osc2-type').value;
    let harm1 = document.getElementById('osc1-harmonize').value;
    let harm2 = document.getElementById('osc2-harmonize').value;
    navigator.requestMIDIAccess().then(function(access) {
        let inputs = access.inputs;
        inputs.forEach((input) => {
            input.onmidimessage = function(message) {
                let frequency = midiNoteToFrequency(message.data[1]);
                // Log events with note values, only log 1 event per note
                if(message.data[0] === 144 && message.data[2] > 0){
                    pressNote(message.data);
                    playNote(frequency*pb[harm1]-2, wav[type1]);
                    playNote(frequency*pb[harm2]-1, wav[type2]);
                    console.log(message);
                }
                if (message.data[0] === 128 || message.data[2] === 0) {
                    pressNote(message.data);
                    stopNote(frequency*pb[harm1]-2);
                    stopNote(frequency*pb[harm2]-1);
                }
            }
        });
        access.onstatechange = function(e) {
            // Print information about the (dis)connected MIDI controller
            console.log(e.port.name, e.port.manufacturer, e.port.state);
        };
    });
}