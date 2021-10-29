
var audioCtx;
var osc;
var timings;
var liveCodeState = [];
const playButton = document.querySelector('button');

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)
    osc = audioCtx.createOscillator();
    timings = audioCtx.createGain();
    timings.gain.value = 0;
    osc.connect(timings).connect(audioCtx.destination);
    osc.start();
    scheduleAudio()
}

function scheduleAudio() {
    let timeElapsedSecs = 0;
    liveCodeState.forEach(noteData => {
        timings.gain.setTargetAtTime(1, audioCtx.currentTime + timeElapsedSecs, 0.01)
        console.log(noteData["pitch"], noteData["length"])
        console.log(audioCtx.currentTime + timeElapsedSecs)
        osc.frequency.setTargetAtTime(noteData["pitch"], audioCtx.currentTime + timeElapsedSecs, 0.01)
        timeElapsedSecs += noteData["length"] / 10.0;
        timings.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.01)
        timeElapsedSecs += 0.2; //rest between notes
    });
    setTimeout(scheduleAudio, timeElapsedSecs * 1000);
}

function parseCode(code) {
    //how could we allow for a repeat operation 
    //(e.g. "3@340 2[1@220 2@330]"" plays as "3@340 1@220 2@330 1@220 2@330")
    //how could we allow for two lines that play at the same time?
    //what if we want variables?
    //how does this parsing technique limit us?
    let notes = makeNotes(code);
    // Will stop playing sounds if the input is empty (unlike the example). 
    console.log(notes)

    //notice this will fail if the input is not correct
    //how could you handle this? allow some flexibility in the grammar? fail gracefully?
    //ideally (probably), the music does not stop
    notes = notes.map(note => {
        noteData = note.split("@");
        return {
            "length": eval(noteData[0]), //the 'eval' function allows us to write js code in our live coding language
            "pitch": eval(noteData[1])
        };
        //what other things should be controlled? osc type? synthesis technique?
    });
    return notes;
}

function makeNotes(code) {
    let processed_notes = [];
    let repeat_times = 1;
    let segment = ""
    for (char_index in code) {
        character = code[char_index]
        if (character == "[" && char_index != 0) {
            repeat_times = eval(segment);
            // Remove the first number from the segment.
            segment = "";
        } else if (character == " " && repeat_times == 1) {
            // Stop recording the segment, and add it to the processed notes.
            if (segment.includes("@")) {
                processed_notes.push(segment);
            }
            segment = "";
        } else if (character == "]") {
            // Stop recording the segment, and add it to the processed notes.
            // Can't handle nested repeat segments (for now) -- will default to the innermost one.
            let processed_segment = makeNotes(segment);
            for (let i = 0; i < repeat_times; i++) {
                for (s_index in processed_segment) {
                    processed_notes.push(processed_segment[s_index]);
                }
            }
            repeat_times = 1;
            segment = "";
        }
        else {
            // Keep recording
            segment += character
        }
    }

    // Add the last segment if not already added
    if (segment.includes("@")) {
        for (let i = 0; i < repeat_times; i++) {
            processed_notes.push(segment)
        }
    }

    console.log(code)
    console.log("processed_notes:")
    console.log(processed_notes)

    return processed_notes;
}

function genAudio(data) {
    liveCodeState = data;
}

function reevaluate() {
    var code = document.getElementById('code').value;
    var data = parseCode(code);
    genAudio(data);
}

playButton.addEventListener('click', function () {
    if (!audioCtx) {
        initAudio();
    }
    reevaluate();
});
