/* script.js - Mini Guitar Hero 3.0
   Autor: Paulo (adaptado)
   Funcionalidades:
   - Gera notas com base em um chart (se existir) ou gera aleatórias enquanto a música tocar
   - Move notas com requestAnimationFrame
   - Detecta hits e toca hitSound
*/

const columns = {
    'a': document.getElementById('col-a'),
    's': document.getElementById('col-s'),
    'd': document.getElementById('col-d'),
    'f': document.getElementById('col-f')
};

const music = document.getElementById('music');
const hitSound = document.getElementById('hit-sound');
const startButton = document.getElementById('startButton');
const scoreEl = document.getElementById('score');

let score = 0;
let running = false;
let animationId = null;
let lastSpawnTime = 0;
let autoSpawnIntervalId = null;

// Tempo (segundos) que a nota leva para descer do topo até a zona de acerto.
// Ajuste para calibrar velocidade das notas.
const travelTime = 2.5; // segundos

// Posição da zona de acerto (em pixels a partir do topo do container).
// Deve corresponder ao seu CSS. Com height 500 e hit-zone bottom:100 => hitY ~= 400
const hitY = 400;

// Janela de acerto (em pixels). Se a nota estiver a essa distância do hitY, conta como acerto.
const hitWindow = 40; // +/- pixels

// Intervalo para gerar notas automaticamente (apenas se você NÃO usar 'chart')
const spawnInterval = 0.6; // segundos

// Chart (opcional) - se estiver vazio o código irá gerar notas enquanto a música tocar
// Cada objeto: { time: <segundos_na_música>, key: 'a'|'s'|'d'|'f' }
const chart = [
    // Exemplo: se quiser usar chart, preencha com tempos reais.
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

// Estado das notas ativas
const activeNotes = []; // { el, key, spawnTime, targetTime }

// Utilitário: cria a nota no DOM e retorna o objeto de nota
function spawnNoteForKey(key, targetTime) {
    const lane = columns[key];
    if (!lane) return null;

    const note = document.createElement('div');
    note.classList.add('note');
    // inicial top será -20 (fora da tela)
    note.style.top = '-20px';
    lane.appendChild(note);

    const spawnTime = performance.now() / 1000; // em segundos (wall clock)
    activeNotes.push({
        el: note,
        key,
        spawnTime,
        targetTime // momento em segundos (music.currentTime) que a nota DEVE bater a zona
    });

    return note;
}

// Atualiza posição de todas as notas (chamado por requestAnimationFrame)
function updateNotes() {
    const nowPerf = performance.now() / 1000;

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        const noteObj = activeNotes[i];
        // tempo restante até o target (em segundos)
        const timeToTarget = noteObj.targetTime - music.currentTime;
        // porcentagem do percurso já feito = 1 - (tempo até target / travelTime)
        // quando tempoToTarget == travelTime -> pct = 0 (no topo)
        // quando timeToTarget == 0 -> pct = 1 (na zona)
        const pct = 1 - (timeToTarget / travelTime);
        // Limita de 0 a 1
        const clamped = Math.max(0, Math.min(1, pct));
        // Distância total do topo até a zona de acerto (hitY)
        // Usamos hitY como coordenada final
        const y = -20 + clamped * (hitY + 20); // ajusta deslocamento inicial
        noteObj.el.style.top = y + 'px';
        noteObj._y = y; // armazenar para referência rápida

        // Remover notas que passaram muito além do hit zone
        if (clamped >= 1.2) { // passou 20% além da zona
            // falha (miss) - apenas remove
            noteObj.el.remove();
            activeNotes.splice(i, 1);
        }
    }

    animationId = requestAnimationFrame(updateNotes);
}

// Função que verifica o chart e cria notas no momento certo
let chartIndex = 0;
function scheduleFromChart() {
    if (!music || chart.length === 0) return;

    // spawn antecipado: queremos criar nota quando music.currentTime >= chart.time - travelTime
    while (chartIndex < chart.length) {
        const entry = chart[chartIndex];
        if (music.currentTime >= (entry.time - travelTime)) {
            // TargetTime será entry.time (momento que a nota deve atingir a zona)
            spawnNoteForKey(entry.key, entry.time);
            chartIndex++;
        } else {
            break;
        }
    }
}

// Gerador automático enquanto a música toca (usado se chart estiver vazio)
function startAutoSpawn() {
    lastSpawnTime = music.currentTime;
    autoSpawnIntervalId = setInterval(() => {
        if (music.paused || music.ended) {
            clearInterval(autoSpawnIntervalId);
            autoSpawnIntervalId = null;
            return;
        }
        // Gera uma nota com targetTime = currentTime + travelTime (logo, ela chegará na zona após travelTime)
        const keys = ['a', 's', 'd', 'f'];
        const key = keys[Math.floor(Math.random() * keys.length)];
        const targetTime = music.currentTime + travelTime;
        spawnNoteForKey(key, targetTime);
    }, spawnInterval * 1000);
}

// Inicia o jogo
function startGame() {
    if (running) return;
    // reset
    score = 0;
    scoreEl.textContent = 'Pontuação: 0';
    // limpa notas antigas (caso haja)
    activeNotes.forEach(n => n.el.remove());
    activeNotes.length = 0;
    chartIndex = 0;

    // iniciar música (já deve ter sido chamado pelo click que aciona startGame)
    music.currentTime = 0;
    const playPromise = music.play();
    // play() pode retornar uma promise rejeitada se bloquear - ignoremos aqui, o clique liberou
    running = true;
    startButton.disabled = true;

    // iniciar loop de animação
    if (!animationId) {
        animationId = requestAnimationFrame(updateNotes);
    }

    // Se tiver chart definido, usamos scheduleFromChart em intervalo curto.
    if (chart && chart.length > 0) {
        // Checar com frequência para spawn antecipado
        const scheduleChecker = setInterval(() => {
            if (!running) {
                clearInterval(scheduleChecker);
                return;
            }
            scheduleFromChart();
            // Para quando a música terminar
            if (music.ended) {
                clearInterval(scheduleChecker);
            }
        }, 30);
    } else {
        // Se não há chart, gera notas automaticamente enquanto a música tocar
        startAutoSpawn();
    }
}

// Para o jogo (quando a música termina ou se o usuário parar)
function stopGame() {
    running = false;
    startButton.disabled = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (autoSpawnIntervalId) {
        clearInterval(autoSpawnIntervalId);
        autoSpawnIntervalId = null;
    }
    // remover notas remanescentes do DOM
    activeNotes.forEach(n => n.el.remove());
    activeNotes.length = 0;
}

// Evento: o botão inicia o jogo (e é uma interação do usuário, então desbloqueia áudio)
startButton.addEventListener('click', () => {
    startGame();
});

// Quando a música termina, paramos o jogo
music.addEventListener('ended', () => {
    stopGame();
});

// Teclado: detectar acertos
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (!columns[key]) return;

    // Procurar a nota mais próxima da zona naquele lane
    let bestIndex = -1;
    let bestDist = Infinity;
    for (let i = 0; i < activeNotes.length; i++) {
        const n = activeNotes[i];
        if (n.key !== key) continue;
        // verificar posição atual (em pixels)
        const y = typeof n._y === 'number' ? n._y : parseFloat(n.el.style.top || 0);
        const dist = Math.abs(y - hitY);
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
        }
    }

    if (bestIndex !== -1 && bestDist <= hitWindow) {
        // acerto!
        const noteObj = activeNotes[bestIndex];
        // visual feedback: remove elemento e tocar som
        noteObj.el.remove();
        activeNotes.splice(bestIndex, 1);

        score += 10;
        scoreEl.textContent = `Pontuação: ${score}`;

        // tocar som de acerto (reset para permitir replay rápido)
        try {
            hitSound.currentTime = 0;
            hitSound.play();
        } catch (err) {
            // nada - alguns navegadores podem bloquear se não houver interação, mas já teve clique
        }

        // (opcional) efeito visual rápido na coluna
        const laneEl = columns[key];
        laneEl.classList.add('hit');
        setTimeout(() => laneEl.classList.remove('hit'), 120);
    } else {
        // opcional: som de miss ou feedback
        // console.log('miss');
    }
});

// Proteção: se o usuário pausar a música manualmente, paramos a geração automática
music.addEventListener('pause', () => {
    // se estiver pausado manualmente, interrompe geração automática
    if (autoSpawnIntervalId) {
        clearInterval(autoSpawnIntervalId);
        autoSpawnIntervalId = null;
    }
});

// Se por algum motivo o usuário buscar ir para outro ponto da música, reajustamos notas
music.addEventListener('seeked', () => {
    // Limpar notas atuais e recalcular spawn conforme posição atual
    activeNotes.forEach(n => n.el.remove());
    activeNotes.length = 0;
    chartIndex = 0;
    // Se você usar chart, deixamos chartIndex apontando para a primeira nota ainda não criada
    if (chart && chart.length > 0) {
        // encontra primeiro index cujo targetTime > music.currentTime - (um buffer)
        while (chartIndex < chart.length && chart[chartIndex].time < music.currentTime - 0.1) {
            chartIndex++;
        }
    }
});

// Adicionar CSS para .hit (feedback visual) se desejar:
// no seu style.css adicione algo como:
// .column.hit { box-shadow: 0 0 20px lime; transform: scale(0.98); transition: 0.1s; }

