// Função para tocar som de notificação usando Web Audio API
export const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0, audioContext.currentTime);
            gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
            gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.2);
        }, 200);
        
    } catch (e) {
        console.log('Som não pode ser reproduzido:', e);
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }
};

export const playNewOrderSound = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const notes = [523, 659, 784];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.15);
            }, index * 150);
        });
        
    } catch (e) {
        console.log('Som não pode ser reproduzido:', e);
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    }
};
