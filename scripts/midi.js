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


let gainNode = context.createGain();
gainNode.gain.value = 0.1;

gainNode.connect(context.destination);


function pressNote(midiArray){
    if(midiArray[1]<36 || midiArray[1] > 95){
        return;
    }
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
    oscillators[frequency].connect(gainNode);
    oscillators[frequency].start(context.currentTime);
}
 
function stopNote (frequency) {
    oscillators[frequency].stop(context.currentTime);
    oscillators[frequency].disconnect();
}
let wav = ['sine', 'square', 'sawtooth', 'triangle'];
//pitch bend multipliers (5th up/down, octave up/down, 3rd up/down)
let pb = [1, 1.5, 0.75, 2, 0.5, 1.26, 0.79];

//save notes + timestamps
let midi_history = [];

let editMode = false;
function abcToggle(){
    editMode = !editMode;
}
const abcDict = ['2','4','8','[',']','(3','z','|',' ',
'C,,','_D,,','D,,','_E,,','E,,','F,,','^F,,','G,,','_A,,','A,,','_B,,','B,,',
'C,','_D,','D,','_E,','E,','F,','^F,','G,','_A,','A,','_B,','B,',
'C','_D','D','_E','E','F','^F','G','_A','A','_B','B',
'c','_d','d','_e','e','f','^f','g','_a','a','_b','b',
'c,','_d,','d,','_e,','e,','f,','^f,','g,','_a,','a,','_b,','b,'
];

let handStaff = 'right';

function editAbc(midiNote){
    switch(midiNote[1]){
        case 21:
            handStaff = 'left';
            break;
            case 23:
            handStaff = 'right';
            break;
            case 96:
            abcToggle();
            break;
            case 97:
            abcRender();
            break;
        default:
            document.getElementById(handStaff).value += abcDict[midiNote[1]-27];
    }
}


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
                    if(editMode){
                        editAbc(message.data);
                    }
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

function inputsToAbc(){

}

/*
** ABC notation reference guide
** = natural
** ^ sharp
** ^^ double sharp
** _ flat
** __ double flat
** z rest
** Z bar's rest
*/

function abcRender() {
    let abcHeader = document.getElementById("header").value;
    let abcRight = document.getElementById("right").value;
    let abcLeft = document.getElementById("left").value;
    let abcString = abcHeader + abcRight + abcLeft;
    console.log(abcString);
    window.ABCJS.renderAbc("paper", abcString);
}
