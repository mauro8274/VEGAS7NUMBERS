const inputEstratto = document.getElementById('numero-estratto');
const valoreUnitarioInput = document.getElementById('valore-unitario');
const listaEstratti = document.getElementById('lista-estratti');
const saldoRealTime = document.getElementById('saldo-real-time');
const btnResetNumeri = document.getElementById('reset-numeri');
const btnResetProgressione = document.getElementById('reset-progressione');
const tabellaDatiElemento = document.getElementById('tabella-dati');
const suggestedNumbersElement = document.getElementById('numeri-suggeriti');
const progressionBody = document.getElementById('progression-body');
const righeTabella = tabellaDatiElemento.querySelectorAll('tbody tr');

// Struttura della TABELLA DATI e dei numeri MEDI
const TABELLA_DATI = [
    [2, 1, 3, 36, 4, 34, 6], [5, 4, 6, 1, 9, 3, 7], [8, 9, 7, 4, 12, 6, 10],
    [11, 12, 10, 9, 13, 7, 15], [14, 13, 15, 12, 16, 10, 18], [17, 16, 18, 13, 21, 15, 19],
    [20, 21, 19, 16, 24, 18, 22], [23, 24, 22, 21, 25, 19, 27], [26, 25, 27, 24, 28, 22, 30],
    [29, 28, 30, 25, 33, 27, 31], [32, 33, 31, 28, 36, 30, 34], [35, 36, 34, 33, 1, 31, 3]
];
const MEDI_PER_RIGA = {
    0: [1, 3], 1: [4, 6], 2: [9, 7], 3: [12, 10], 4: [13, 15], 5: [16, 18], 
    6: [21, 19], 7: [24, 22], 8: [25, 27], 9: [28, 30], 10: [33, 31], 11: [36, 34]
};

// Struttura della PROGRESSIONE PUNTATE (Moltiplicatori)
const PROGRESSION_MULTIPLIERS = [
    { BIG: 4, MEDI: 2, MINI: 1 }, { BIG: 4, MEDI: 2, MINI: 1 }, { BIG: 4, MEDI: 2, MINI: 1 },
    { BIG: 6, MEDI: 4, MINI: 1 }, { BIG: 6, MEDI: 4, MINI: 2 }, { BIG: 10, MEDI: 8, MINI: 4 },
    { BIG: 8, MEDI: 4, MINI: 4 }, { BIG: 8, MEDI: 5, MINI: 4 }, { BIG: 10, MEDI: 5, MINI: 4 },
    { BIG: 10, MEDI: 6, MINI: 4 }, { BIG: 12, MEDI: 8, MINI: 4 }, { BIG: 12, MEDI: 8, MINI: 4 },
    { BIG: 8, MEDI: 8, MINI: 4 }, { BIG: 9, MEDI: 9, MINI: 4 }, { BIG: 10, MEDI: 10, MINI: 4 },
    { BIG: 11, MEDI: 11, MINI: 4 }, { BIG: 12, MEDI: 12, MINI: 4 }, { BIG: 12, MEDI: 12, MINI: 4 },
    { BIG: 13, MEDI: 13, MINI: 4 }, { BIG: 15, MEDI: 15, MINI: 4 } 
];

// STATO GLOBALE
let numeriEstratti = [];
let righeBruciate = new Array(12).fill(false);
let mediUscitiPerRiga = new Array(12).fill(0).map(() => new Set()); 
let isBettingPhase = false; 
let suggestedNumbers = null; // [BIG, MEDIO1, MEDIO2, MINI1, MINI2, MINI3, MINI4]
let currentStep = 0; 
let currentSaldo = 0; 

// Funzione helper per formattare la valuta
const formatCurrency = (value) => `€ ${value.toFixed(2).replace('.', ',')}`;

// Funzione per inizializzare la tabella progressione con gli importi dinamici
function initializeProgressionTable() {
    progressionBody.innerHTML = '';
    // Usa 0.10 come base se l'utente non ha inserito nulla, altrimenti usa il valore inserito.
    const unitValue = parseFloat(valoreUnitarioInput.value) || 0; 

    PROGRESSION_MULTIPLIERS.forEach((mult, index) => {
        const step = index + 1;
        const riga = progressionBody.insertRow();
        riga.id = `step-row-${step}`;
        
        const bigBet = mult.BIG * unitValue;
        const medioBet = mult.MEDI * unitValue;
        const miniBet = mult.MINI * unitValue;

        riga.innerHTML = `
            <td>STEP ${step}</td>
            <td>${formatCurrency(bigBet)}</td>
            <td>${formatCurrency(medioBet)}</td>
            <td>${formatCurrency(medioBet)}</td>
            <td>${formatCurrency(miniBet)}</td>
            <td>${formatCurrency(miniBet)}</td>
            <td>${formatCurrency(miniBet)}</td>
            <td>${formatCurrency(miniBet)}</td>
        `;
    });
}

// Calcola lo stake totale e i singoli bet per lo step corrente
function calculateStake(step, unitValue) {
    if (step < 1 || step > 20) return null;
    const mult = PROGRESSION_MULTIPLIERS[step - 1];
    
    const bigBet = mult.BIG * unitValue;
    const medioBet = mult.MEDI * unitValue;
    const miniBet = mult.MINI * unitValue;
    
    const totalStake = bigBet + (2 * medioBet) + (4 * miniBet);

    return { bigBet, medioBet, miniBet, totalStake };
}

// Aggiorna l'header della progressione con i numeri selezionati
function updateProgressionHeader(numbers) {
    document.getElementById('big-number').textContent = numbers[0] || '?';
    document.getElementById('medio1-number').textContent = numbers[1] || '?';
    document.getElementById('medio2-number').textContent = numbers[2] || '?';
    document.getElementById('mini1-number').textContent = numbers[3] || '?';
    document.getElementById('mini2-number').textContent = numbers[4] || '?';
    document.getElementById('mini3-number').textContent = numbers[5] || '?';
    document.getElementById('mini4-number').textContent = numbers[6] || '?';
}

// Evidenzia lo step corrente
function highlightStep(newStep) {
    // Rimuove la classe dallo step precedente
    if (currentStep >= 1 && currentStep <= 20) {
        const prevRow = document.getElementById(`step-row-${currentStep}`);
        if (prevRow) prevRow.classList.remove('active-step');
    }
    
    // Evidenzia il nuovo step
    if (newStep >= 1 && newStep <= 20) {
        const newRow = document.getElementById(`step-row-${newStep}`);
        if (newRow) newRow.classList.add('active-step');
    }
    currentStep = newStep;
}

// Funzione per aggiornare la lista dei numeri estratti (in colonna)
function updateEstrattiList() {
    listaEstratti.innerHTML = ''; 
    const maxDisplay = 30; 
    numeriEstratti.slice(0, maxDisplay).forEach(numero => {
        const row = listaEstratti.insertRow();
        const cell = row.insertCell();
        cell.textContent = numero;
    });
}

function updateSuggestedNumbers(numbers) {
    if (numbers && numbers.length > 0) {
        suggestedNumbersElement.innerHTML = `<strong>${numbers.join(', ')}</strong>`;
    } else {
        suggestedNumbersElement.textContent = 'Attendendo la Logica...';
    }
}

// Logica di Bruciatura (Regole 1 & 2)
function checkIfRowBruciata(rigaIndex, numeroEstratto) {
    if (righeBruciate[rigaIndex]) return; 

    const rigaElemento = righeTabella[rigaIndex];
    const datiRiga = TABELLA_DATI[rigaIndex];

    // 1. Regola 1: Estrazione di un numero BIG (Prima Colonna)
    if (datiRiga[0] === numeroEstratto) {
        righeBruciate[rigaIndex] = true;
        rigaElemento.classList.add('riga-bruciata');
        return;
    }

    // 2. Regola 2: Estrazione di ENTRAMBI i numeri MEDI
    const numeriMedi = MEDI_PER_RIGA[rigaIndex];
    if (numeriMedi.includes(numeroEstratto)) {
        mediUscitiPerRiga[rigaIndex].add(numeroEstratto);
        
        if (mediUscitiPerRiga[rigaIndex].size === 2) {
            righeBruciate[rigaIndex] = true;
            rigaElemento.classList.add('riga-bruciata');
        }
    }
}

// Traccia, Brucia, Controlla Vittoria (Logica pre-gioco)
function tracciaNumeroPreGame(numero) {
    let winTriggered = false;

    TABELLA_DATI.forEach((rigaDati, rigaIndex) => {
        if (winTriggered) return; // Se la fase di gioco è già stata attivata

        rigaDati.forEach((valore, colonnaIndex) => {
            if (valore === numero) {
                const rigaElemento = righeTabella[rigaIndex];
                const cella = rigaElemento.cells[colonnaIndex];
                
                let nuovaEvidenziazione = false;
                if (!righeBruciate[rigaIndex]) {
                    if (!cella.classList.contains('evidenziato')) {
                        cella.classList.add('evidenziato'); 
                        nuovaEvidenziazione = true;
                    }
                }
                
                // Check WIN Condition (4 celle evidenziate)
                if (!righeBruciate[rigaIndex] && nuovaEvidenziazione) {
                    const evidenziateNellaRiga = rigaElemento.querySelectorAll('.evidenziato').length;

                    if (evidenziateNellaRiga === 4) { 
                        triggerBettingPhase(rigaIndex, rigaDati);
                        winTriggered = true;
                        return; 
                    }
                }
                
                // Check BRUCIATURA
                if (!righeBruciate[rigaIndex]) {
                    checkIfRowBruciata(rigaIndex, numero);
                }
            }
        });
    });
}

// Funzione CHIAVE: Attivazione della Fase di Gioco
function triggerBettingPhase(rigaIndex, rigaDati) {
    const unitValue = parseFloat(valoreUnitarioInput.value);
    if (isNaN(unitValue) || unitValue <= 0) {
         alert('ATTENZIONE: Inserisci prima un "Valore Unitario €" valido per iniziare la progressione.');
         isBettingPhase = false;
         suggestedNumbers = null;
         return;
    }

    isBettingPhase = true;
    suggestedNumbers = rigaDati;
    
    updateProgressionHeader(rigaDati);
    updateSuggestedNumbers(rigaDati);
    
    // Inizializza al primo step e registra la perdita iniziale (Stake Step 1)
    highlightStep(1);
    updateSaldoLoss(); 
    
    const numeri = rigaDati.join(', ');
    alert(`CI SIAMO! I 7 numeri da giocare sono: ${numeri}`);
}

// Logica di Progressione (Fase di Gioco)
function processBettingPhase(numeroEstratto) {
    const unitValue = parseFloat(valoreUnitarioInput.value);
    const isWin = suggestedNumbers.includes(numeroEstratto);
    const currentStake = calculateStake(currentStep, unitValue);
    
    if (!currentStake) {
        return;
    }

    if (isWin) {
        // *** SCENARIO DI VINCITA ***
        let betOnWinNumber = 0;
        const winIndex = suggestedNumbers.indexOf(numeroEstratto);
        
        // Mappatura delle puntate in base alla colonna vincente
        if (winIndex === 0) { // BIG
            betOnWinNumber = currentStake.bigBet;
        } else if (winIndex === 1 || winIndex === 2) { // MEDI
            betOnWinNumber = currentStake.medioBet;
        } else { // MINI
            betOnWinNumber = currentStake.miniBet;
        }

        // Calcolo Vincita Netta: (Bet * 36) - Total Stake
        const netProfit = (betOnWinNumber * 36) - currentStake.totalStake;
        
        currentSaldo += netProfit;
        saldoRealTime.textContent = formatCurrency(currentSaldo);

        alert(`HAI VINTO ${formatCurrency(netProfit)}! Procedi ad archiviare la giocata. La progressione è stata resettata.`);
        
        resetProgressionState();

    } else {
        // *** SCENARIO DI PERDITA (Avanzamento Step) ***
        
        if (currentStep < 20) {
            currentStep++;
            highlightStep(currentStep);
            updateSaldoLoss(); // Aggiorna il saldo con la perdita del nuovo step
        } else {
            alert("Progressione terminata all'ultimo Step (20). Resetta per iniziare una nuova giocata.");
            resetProgressionState();
        }
    }
}

// Aggiorna il Saldo in caso di Loss (Nuovo Step)
function updateSaldoLoss() {
     const unitValue = parseFloat(valoreUnitarioInput.value);
     const currentStake = calculateStake(currentStep, unitValue);

     if (currentStake) {
        // La perdita è l'ammontare totale giocato nello step
        currentSaldo -= currentStake.totalStake;
        saldoRealTime.textContent = formatCurrency(currentSaldo);
     }
}

// Reset completo della progressione di puntate
function resetProgressionState() {
    isBettingPhase = false;
    suggestedNumbers = null;
    currentStep = 0;
    
    highlightStep(0); 
    updateProgressionHeader(['?', '?', '?', '?', '?', '?', '?']); 
    updateSuggestedNumbers(null); 
}


// *** LISTENER PRINCIPALI ***

// Inizializza la progressione alla carica della pagina e all'input del valore unitario
window.onload = initializeProgressionTable;
valoreUnitarioInput.addEventListener('input', initializeProgressionTable);


// Gestione dell'input del numero estratto
inputEstratto.addEventListener('change', (event) => {
    const valoreInput = event.target.value;
    if (valoreInput === '') return; 

    const numero = parseInt(valoreInput);
    
    if (numero >= 0 && numero <= 36) {
        numeriEstratti.unshift(numero); 
        updateEstrattiList();
        
        if (isBettingPhase) {
            processBettingPhase(numero);
        } else {
            tracciaNumeroPreGame(numero);
        }

        event.target.value = '';
        event.target.focus();
    } else {
        alert('Inserisci un numero valido tra 0 e 36.');
        event.target.value = '';
        event.target.focus();
    }
});

// Gestione del pulsante Reset Numeri (Reset COMPLETO)
btnResetNumeri.addEventListener('click', () => {
    if(confirm("Sei sicuro di voler resettare tutti i dati (numeri estratti, bruciature, fase di gioco e saldo)?")) {
        numeriEstratti = [];
        righeBruciate = new Array(12).fill(false);
        mediUscitiPerRiga = new Array(12).fill(0).map(() => new Set()); 
        currentSaldo = 0; 
        saldoRealTime.textContent = formatCurrency(currentSaldo);
        
        updateEstrattiList();
        resetProgressionState();

        righeTabella.forEach(riga => {
            riga.classList.remove('riga-bruciata');
        });
        tabellaDatiElemento.querySelectorAll('.evidenziato').forEach(cell => {
            cell.classList.remove('evidenziato');
        });
        
        inputEstratto.focus();
        alert('Tutti i dati sono stati resettati.');
    }
});

// Gestione del pulsante RESET PROGRESSIONE (solo progressione)
btnResetProgressione.addEventListener('click', () => {
     if (confirm("Sei sicuro di voler resettare la progressione di puntate (tornare allo stato pre-gioco)?")) {
        resetProgressionState();
        alert('Progressione resettata. In attesa di una nuova riga vincente.');
     }
});

// Placeholder per il bottone Visualizza archivio
document.getElementById('visualizza-archivio').addEventListener('click', () => {
    alert('Funzionalità "Visualizza archivio" non implementata. Richiederebbe una nuova logica di storage.');
});

// Esegue l'inizializzazione iniziale
initializeProgressionTable();
