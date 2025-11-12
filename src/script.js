const columns = {
    'a': document.getElementById('.col-a'),
    's': document.getElementById('.col-s'),
    'd': document.getElementById('.col-d'),
    'f': document.getElementById('.col-f'),
};

const music = document.getElementById('music');
const hitSound = document.getElementById('hit-sound');
const startButton = document.getElementById('startButton');
const scoreEl = document.getElementById('score');

let score = 0;
let startTime = 0;
let gameInterval;


//Notas no Ritmo (tempo em Segundos, Coluna correspondente)
const cahrt = [
    { time: 1.0, key: 'a' },
    { time: 1.4, key: 's' },
    { time: 1.8, key: 'd' },
    { time: 2.2, key: 'f' },
    { time: 3.0, key: 'a' },
    { time: 3.4, key: 's' },
    { time: 3.8, key: 'd' },
    { time: 4.2, key: 'f' },
    { time: 5.0, key: 'a' },
    { time: 5.4, key: 's' },
    { time: 6.0, key: 'f' },
    { time: 6.5, key: 'd' },
    { time: 7.2, key: 'a' },
    { time: 7.8, key: 's' },
    { time: 8.2, key: 'f' },
];

//criar nota
function createNote(key) {
    const note = document.createElement('div');
    note.classList.add('note');
    columns[key].appendChild(note);

    let pos = -20;
    const fall = setInterval(() => {
        pos += 5;
        note.style.top = pos + 'px';

        if (pos > 500) {
            clearInterval(fall);
            note.remove();
        }
    }, 30);
}

// Iniciar jogo
startBtn.addEventListener('click', () => {
    score = 0;
    scoreEl.textContent = 'Pontos: 0';
    startBtn.disabled = true;
    music.currentTime = 0;
    music.play();
    startTime = Date.now();

    let chartIndex = 0;
    gameInterval = setInterval(() => {
        const currentTime = (Date.now() - startTime) / 1000;
        if (chartIndex < chart.length && currentTime >= chart[chartIndex].time) {
            createNote(chart[chartIndex].key);
            chartIndex++;
        }
        if (chartIndex >= chart.length && currentTime > chart[chart.length - 1].time + 5) {
            clearInterval(gameInterval);
            startBtn.disabled = false;
        }
    }, 10);
});

// Acertos com som
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (columns[key]) {
        const notes = columns[key].getElementsByClassName('note');
        for (let note of notes) {
            const top = parseInt(note.style.top);
            if (top > 400 && top < 480) {
                note.remove();
                score += 10;
                scoreEl.textContent = `Pontos: ${score}`;
                hitSound.currentTime = 0;
                hitSound.play();
                break;
            }
        }
    }
});