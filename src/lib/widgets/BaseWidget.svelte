<script lang="ts">
	import type { PublicUser } from '$lib/db/schema/users';
	import type { AnyWidget } from '$lib/widgets/types';
	import { type Snippet } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import { enhance } from '$app/forms';
	import { PencilSimple, TrashSimple } from 'phosphor-svelte';
	import Button from '$lib/components/Button.svelte';
	import { dialogPortal } from '$lib/portals/dialog.svelte';
	import { fly } from 'svelte/transition';

	let {
		editing,
		modalOpened = $bindable(false),
		widget,
		editMenu,
		children
	}: {
		editing?: boolean;
		modalOpened?: boolean;
		user: PublicUser;
		widget?: AnyWidget;
		editMenu?: Snippet;
		children: Snippet;
	} = $props();

	let wrapperEl = $state<HTMLDivElement>();
	let dialogEl = $state<HTMLDialogElement>();
	let dialogContentsEl = $state<HTMLDivElement>();

	const animationDurationMs = 350;

	function expandDialog() {
		if (!wrapperEl || !dialogEl || !dialogContentsEl) return;

		// get the dimensions of the widget wrapper & the dialog's contents so we can animate to it
		const wrapperRect = wrapperEl.getBoundingClientRect();

		modalOpened = true;
		dialogEl.showModal();

		// hide the original widget
		wrapperEl.style.visibility = 'hidden';

		// set the dialog
		dialogEl.style.transition = '';
		dialogEl.style.left = `${wrapperRect.x}px`;
		dialogEl.style.top = `${wrapperRect.y}px`;
		dialogEl.style.width = `${wrapperRect.width}px`;
		dialogEl.style.height = `${wrapperRect.height}px`;

		// wait for the next frame to animate
		requestAnimationFrame(() => {
			if (!dialogEl || !dialogContentsEl) return;
			// the widget's height plus the padding of the dialog
			// we need to get the computed padding because it depends on the user's theme (default to 1rem, aka 16px)
			const dialogContentsRect = dialogContentsEl.getBoundingClientRect();
			const dialogPadding =
				parseInt(window.getComputedStyle(dialogEl).padding.replace('px', '')) || 16;

			dialogEl.style.transition = `all ${animationDurationMs}ms cubic-bezier(0.75, -0.2, 0.15, 1.2)`;

			// transition to center
			dialogEl.style.left = '50%';
			dialogEl.style.top = '50%';
			dialogEl.style.transform = 'translate(-50%, -50%)';
			dialogEl.style.width = '700px';
			// set a absolute height so it can be animated
			dialogEl.style.height = `${dialogContentsRect.height + dialogPadding * 2}px`;
		});

		dialogEl.addEventListener(
			'transitionend',
			() => {
				// set the dialog height to fit the content so that
				// the dialog can be expanded (when there's a textarea, for example)
				dialogEl!.style.height = 'fit-content';
				// remove transition to avoid weird side-effects
				dialogEl!.style.transition = '';
			},
			{ once: true }
		);
	}

	function closeDialog(ev: Event) {
		ev.preventDefault();

		if (!wrapperEl || !dialogEl) return;

		// we change the variable first so the background can darken at the same time
		modalOpened = false;

		// set dialog height to a value in px so it can animate
		const dialogRect = dialogEl.getBoundingClientRect();
		if (!dialogRect) return;

		dialogEl.style.transition = '';
		dialogEl.style.height = `${dialogRect.height}px`;

		requestAnimationFrame(() => {
			if (!wrapperEl || !dialogEl) return;
			// enable transition
			dialogEl.style.transition = `all ${animationDurationMs}ms cubic-bezier(0.75, -0.2, 0.15, 1.2)`;

			const wrapperRect = wrapperEl.getBoundingClientRect();
			if (!wrapperRect) return;

			dialogEl.style.left = `${wrapperRect.x}px`;
			dialogEl.style.top = `${wrapperRect.y}px`;
			dialogEl.style.transform = 'none';
			dialogEl.style.width = `${wrapperRect.width}px`;
			dialogEl.style.height = `${wrapperRect.height}px`;
		});

		dialogEl.addEventListener(
			'transitionend',
			() => {
				// wait for the animation to finish before closing the dialog
				// or it brutally interrupts because of display: none;
				dialogEl!.close();

				// show the original widget
				wrapperEl!.style.visibility = '';
				// remove transition to avoid weird side-effects
				dialogEl!.style.transition = '';
			},
			{ once: true }
		);
	}

	$effect(() => {
		if (!editMenu) return;

		// if (modalOpened) {
		// 	expandDialog();
		// } else {
		// 	closeDialog(new Event('cancel'));
		// }
	});
</script>

{#snippet confirmDeleteDialog()}
	<form
		use:enhance={() =>
			({ update }) => {
				dialogPortal.closeDialog();
				update();
			}}
		action="/api/profile?/deleteWidget&id={widget!.id}"
		method="post"
		class="confirm-delete"
	>
		<h2>Are you sure you want to delete this widget?</h2>

		<p>
			Contents of the widget will be lost. You can bring it back with the + menu, but it will be
			blank.
		</p>

		<div class="buttons">
			<Button inline type="button" variant="secondary" onclick={() => dialogPortal.closeDialog()}>
				Cancel
			</Button>
			<Button inline type="submit" variant="urgent">Delete widget</Button>
		</div>
	</form>
{/snippet}

<div class="widget-root">
	{#if editing && editMenu}
		<dialog aria-label="Edit widget" bind:this={dialogEl} oncancel={closeDialog}>
			<div class="menu" bind:this={dialogContentsEl}>
				{@render editMenu()}
			</div>
		</dialog>

		<div
			inert
			aria-hidden={true}
			class:open={modalOpened}
			class="dialog-backdrop"
			style:transition-duration="{animationDurationMs}ms"
		></div>
	{/if}

	<div class="widget-wrapper" class:editing={modalOpened} bind:this={wrapperEl}>
		{#if editing}
			<div class="hover-menu" transition:fly={{ duration: 150, y: -10 }}>
				{#if editMenu}
					<button aria-label="Edit widget" onclick={expandDialog}>
						<PencilSimple size={20} />
					</button>
				{/if}
				{#if widget}
					<!-- if the menu is editable, open the dialog to confirm deletion -->
					{#if editMenu}
						<button
							onclick={() => dialogPortal.openDialog(confirmDeleteDialog)}
							aria-label="Delete widget"
						>
							<TrashSimple size={20} />
						</button>
						<!-- otherwise we dont really care and can delete right away -->
					{:else}
						<form use:enhance action="/api/profile?/deleteWidget&id={widget.id}" method="post">
							<button aria-label="Delete widget">
								<TrashSimple size={20} />
							</button>
						</form>
					{/if}
				{/if}
			</div>
		{/if}

		<Card inert={editing}>
			{@render children()}
		</Card>
	</div>
</div>

<style lang="scss">
	.dialog-backdrop {
		background-color: transparent;
		transition: background-color;
		position: fixed;
		inset: 0;
		height: 100vh;
		width: 100vw;
		z-index: 99;

		&.open {
			background-color: #00000060;
		}
	}

	dialog {
		gap: var(--base-gap);
		background-color: var(--widgets-background-color);
		padding: var(--base-padding);
		border-radius: var(--widgets-border-base-radius);
		border: var(--widgets-border-width) solid var(--widgets-border-color);
		box-shadow: var(--widgets-box-shadow-x) var(--widgets-box-shadow-y)
			var(--widgets-box-shadow-blur) var(--widgets-box-shadow-color);
		overflow: hidden;
		max-width: 100%;

		&[open] {
			display: flex;
			flex-direction: column;
		}

		&::backdrop {
			background-color: transparent;
		}
	}

	.widget-wrapper {
		position: relative;

		.hover-menu {
			display: flex;
			position: absolute;
			right: calc(var(--base-padding) * 0.25);
			top: calc(var(--base-padding) * 0.25);
			padding: calc(var(--base-padding) * 0.25);
			gap: calc(var(--base-gap) * 0.25);

			button {
				border: none;
				border: var(--inputs-border-width) solid var(--inputs-border-color);
				border-radius: calc(var(--inputs-border-base-radius) + var(--base-padding) * 0.25);
				background: var(--widgets-background-color-dim);
				padding: calc(var(--base-padding) * 0.25);
				color: var(--inputs-on-background-color);
				cursor: pointer;
			}
		}
	}

	.confirm-delete {
		display: flex;
		flex-direction: column;
		gap: var(--base-gap);

		h2 {
			font-size: 1.5rem;
			text-wrap: balance;
		}

		.buttons {
			display: flex;
			gap: calc(var(--base-gap) * 0.5);
			justify-content: flex-end;
		}
	}
</style>
