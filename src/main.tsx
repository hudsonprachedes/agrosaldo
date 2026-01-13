import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAgeGroupMigration } from "./lib/age-group-migration";
import { mockMovements } from "./mocks/mock-bovinos";

createRoot(document.getElementById("root")!).render(<App />);

// Inicializar migração automática de faixas etárias
initializeAgeGroupMigration(mockMovements, (result) => {
	console.log(`🐄 Migração automática: ${result.migratedCount} animais atualizados`);
});

// Registrar Service Worker para offline-first
if ('serviceWorker' in navigator) {
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
}
