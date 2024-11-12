import type { Snippet } from 'svelte';

type DialogStateSnapshot = {
	component: Snippet<[unknown]>;
	props?: Record<string, unknown>;
};

class DialogState {
	current = $state<DialogStateSnapshot>();
	history = $state<DialogStateSnapshot[]>([]);

	openDialog(component: Snippet, props?: Record<string, unknown>) {
		this.current = { component, props };
		this.history = [...this.history, this.current];
	}

	closeDialog() {
		this.history = this.history.slice(0, -1);
		this.current = this.history.at(-1);
	}

	clearHistory() {
		// remove dialogs one by one with a 100ms delay
		const clear = () => {
			if (this.history.length > 0) {
				this.closeDialog();
				setTimeout(clear, 100);
			}
		};

		clear();
	}
}

export const dialogState = new DialogState();