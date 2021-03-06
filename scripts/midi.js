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
    if(midiArray[0] === 128 || midiArray[2] === 0){
        target.style="";
    }else{
        target.style = "background:" + "blue;";
    }
}

let wav = ['sine', 'square', 'sawtooth', 'triangle'];

//pitch bend multipliers (5th up/down, octave up/down, 3rd up/down)
let pb = [1, 1.5, 0.75, 2, 0.5, 1.26, 0.79];

const abcDict = ['2','4','8','[',']','(3','z','|',' ',
'C,,','_D,,','D,,','_E,,','E,,','F,,','^F,,','G,,','_A,,','A,,','_B,,','B,,',
'C,','_D,','D,','_E,','E,','F,','^F,','G,','_A,','A,','_B,','B,',
'C','_D','D','_E','E','F','^F','G','_A','A','_B','B',
'c','_d','d','_e','e','f','^f','g','_a','a','_b','b',
'c\'','_d\'','d\'','_e\'','e\'','f\'','^f\'','g\'','_a\'','a\'','_b\'','b\''
];

let handStaff = 'right';

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

let editMode = false;
function abcToggle(){
    editMode = !editMode;
}

let notes = {};
notes.active = [];

function editAbc(midiNote){
    if(midiNote === 21){
        document.getElementById('rightHeader').style="";
        handStaff = 'left';
        document.getElementById('leftHeader').style="font-weight:" + "bold;";
    }else if(midiNote === 23){
        document.getElementById('leftHeader').style="";
        handStaff = 'right';
        document.getElementById('rightHeader').style="font-weight:" + "bold;";
    }else{
        switch(notes.active.length){
            case 1:
                document.getElementById(handStaff).value += abcDict[notes.active[0]-27];
                abcRender();
                break;
            case 0:
                document.getElementById(handStaff).value += ' ';
                break;
            default:
                document.getElementById(handStaff).value += '[';
                for(let i=0; i<notes.active.length; i++){
                    document.getElementById(handStaff).value += abcDict[notes.active[i]-27];
                }
                document.getElementById(handStaff).value += ']';
                abcRender();
        }
    }
    notes.active=[];
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
                        notes[message.data[1]] = 1;
                        notes.active.push(message.data[1]);
                    }
                    playNote(frequency*pb[harm1]-2, wav[type1]);
                    playNote(frequency*pb[harm2]-1, wav[type2]);
                    console.log(message);
                }
                if (message.data[0] === 128 || message.data[2] === 0) {
                    if(editMode){
                        if(notes[message.data[1]]){
                            notes[message.data[1]] = 0;
                            editAbc(message.data[1]);
                        }
                    }
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
