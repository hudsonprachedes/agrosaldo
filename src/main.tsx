import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para offline-first (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {
				console.log('Service Worker registrado com sucesso:', registration.scope);
        
				// Verificar atualizações a cada 1 hora
				setInterval(() => {
					registration.update();
				}, 60 * 60 * 1000);
			})
			.catch((error) => {
				console.error('Erro ao registrar Service Worker:', error);
			});
	});

	// Listener para mensagens do Service Worker
	navigator.serviceWorker.addEventListener('message', (event) => {
		console.log('Mensagem do Service Worker:', event.data);
    
		if (event.data.type === 'SYNC_MOVEMENTS') {
			// Disparar evento customizado para components ouvirem
			window.dispatchEvent(new CustomEvent('sync-movements'));
		}
    
		if (event.data.type === 'SYNC_PHOTOS') {
			window.dispatchEvent(new CustomEvent('sync-photos'));
		}
	});
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
	// Desregistrar Service Worker em desenvolvimento
	navigator.serviceWorker.getRegistrations().then((registrations) => {
		registrations.forEach((registration) => {
			registration.unregister();
			console.log('Service Worker desregistrado (modo desenvolvimento)');
		});
	});
}
