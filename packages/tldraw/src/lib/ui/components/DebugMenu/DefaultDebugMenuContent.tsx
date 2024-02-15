import { DialogTitle } from '@radix-ui/react-dialog'
import {
	DebugFlag,
	Editor,
	TLShapePartial,
	createShapeId,
	debugFlags,
	featureFlags,
	hardResetEditor,
	track,
	uniqueId,
	useEditor,
} from '@tldraw/editor'
import React from 'react'
import { useDialogs } from '../../context/dialogs'
import { useToasts } from '../../context/toasts'
import { untranslated } from '../../hooks/useTranslation/useTranslation'
import { TldrawUiMenuCheckboxItem } from '../menus/TldrawUiMenuCheckboxItem'
import { TldrawUiMenuGroup } from '../menus/TldrawUiMenuGroup'
import { TldrawUiMenuItem } from '../menus/TldrawUiMenuItem'
import { TldrawUiMenuSubmenu } from '../menus/TldrawUiMenuSubmenu'
import { Button } from '../primitives/Button'
import { DialogBody, DialogCloseButton, DialogFooter, DialogHeader } from '../primitives/Dialog'

/** @public */
export function DefaultDebugMenuContent() {
	const editor = useEditor()
	const { addToast } = useToasts()
	const { addDialog } = useDialogs()
	const [error, setError] = React.useState<boolean>(false)

	return (
		<>
			<TldrawUiMenuGroup id="items">
				<TldrawUiMenuItem
					id="add-toast"
					onSelect={() => {
						addToast({
							id: uniqueId(),
							title: 'Something happened',
							description: 'Hey, attend to this thing over here. It might be important!',
							keepOpen: true,
							// icon?: string
							// title?: string
							// description?: string
							// actions?: TLUiToastAction[]
						})
						addToast({
							id: uniqueId(),
							title: 'Something happened',
							description: 'Hey, attend to this thing over here. It might be important!',
							keepOpen: true,
							actions: [
								{
									label: 'Primary',
									type: 'primary',
									onClick: () => {
										void null
									},
								},
								{
									label: 'Normal',
									type: 'normal',
									onClick: () => {
										void null
									},
								},
								{
									label: 'Danger',
									type: 'danger',
									onClick: () => {
										void null
									},
								},
							],
							// icon?: string
							// title?: string
							// description?: string
							// actions?: TLUiToastAction[]
						})
						addToast({
							id: uniqueId(),
							title: 'Something happened',
							description: 'Hey, attend to this thing over here. It might be important!',
							keepOpen: true,
							icon: 'twitter',
							actions: [
								{
									label: 'Primary',
									type: 'primary',
									onClick: () => {
										void null
									},
								},
								{
									label: 'Normal',
									type: 'normal',
									onClick: () => {
										void null
									},
								},
								{
									label: 'Danger',
									type: 'danger',
									onClick: () => {
										void null
									},
								},
							],
						})
					}}
					label={untranslated('Show toast')}
				/>
				<TldrawUiMenuItem
					id="show-dialog"
					label={'Show dialog'}
					onSelect={() => {
						addDialog({
							component: ({ onClose }) => (
								<ExampleDialog
									displayDontShowAgain
									onCancel={() => onClose()}
									onContinue={() => onClose()}
								/>
							),
							onClose: () => {
								void null
							},
						})
					}}
				/>
				<TldrawUiMenuItem
					id="create-shapes"
					label={'Create 100 shapes'}
					onSelect={() => createNShapes(editor, 100)}
				/>
				<TldrawUiMenuItem
					id="count-nodes"
					label={'Count shapes / nodes'}
					onSelect={() => {
						function countDescendants({ children }: HTMLElement) {
							let count = 0
							if (!children.length) return 0
							for (const el of [...(children as any)]) {
								count++
								count += countDescendants(el)
							}
							return count
						}
						const selectedShapes = editor.getSelectedShapes()
						const shapes =
							selectedShapes.length === 0 ? editor.getRenderingShapes() : selectedShapes
						const elms = shapes.map(
							(shape) => (document.getElementById(shape.id) as HTMLElement)!.parentElement!
						)
						let descendants = elms.length
						for (const elm of elms) {
							descendants += countDescendants(elm)
						}
						window.alert(`Shapes ${shapes.length}, DOM nodes:${descendants}`)
					}}
				/>
				{(() => {
					if (error) throw Error('oh no!')
				})()}
				<TldrawUiMenuItem id="throw-error" onSelect={() => setError(true)} label={'Throw error'} />
				<TldrawUiMenuItem id="hard-reset" onSelect={hardResetEditor} label={'Hard reset'} />
			</TldrawUiMenuGroup>
			<TldrawUiMenuGroup id="flags">
				<DebugFlags />
				<FeatureFlags />
			</TldrawUiMenuGroup>

			{/* {...children} */}
		</>
	)
}

function DebugFlags() {
	const items = Object.values(debugFlags)
	if (!items.length) return null
	return (
		<TldrawUiMenuSubmenu id="debug flags" label="Debug Flags">
			<TldrawUiMenuGroup id="debug flags">
				{items.map((flag) => (
					<DebugFlagToggle key={flag.name} flag={flag} />
				))}
			</TldrawUiMenuGroup>
		</TldrawUiMenuSubmenu>
	)
}

function FeatureFlags() {
	const items = Object.values(featureFlags)
	if (!items.length) return null
	return (
		<TldrawUiMenuSubmenu id="feature flags" label="Feature Flags">
			<TldrawUiMenuGroup id="feature flags">
				{items.map((flag) => (
					<DebugFlagToggle key={flag.name} flag={flag} />
				))}
			</TldrawUiMenuGroup>
		</TldrawUiMenuSubmenu>
	)
}

function ExampleDialog({
	title = 'title',
	body = 'hello hello hello',
	cancel = 'Cancel',
	confirm = 'Continue',
	displayDontShowAgain = false,
	onCancel,
	onContinue,
}: {
	title?: string
	body?: string
	cancel?: string
	confirm?: string
	displayDontShowAgain?: boolean
	onCancel: () => void
	onContinue: () => void
}) {
	const [dontShowAgain, setDontShowAgain] = React.useState(false)

	return (
		<>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<DialogCloseButton />
			</DialogHeader>
			<DialogBody style={{ maxWidth: 350 }}>{body}</DialogBody>
			<DialogFooter className="tlui-dialog__footer__actions">
				{displayDontShowAgain && (
					<Button
						type="normal"
						onClick={() => setDontShowAgain(!dontShowAgain)}
						iconLeft={dontShowAgain ? 'check' : 'checkbox-empty'}
						style={{ marginRight: 'auto' }}
					>
						{`Don't show again`}
					</Button>
				)}
				<Button type="normal" onClick={onCancel}>
					{cancel}
				</Button>
				<Button type="primary" onClick={async () => onContinue()}>
					{confirm}
				</Button>
			</DialogFooter>
		</>
	)
}

const DebugFlagToggle = track(function DebugFlagToggle({
	flag,
	onChange,
}: {
	flag: DebugFlag<boolean>
	onChange?: (newValue: boolean) => void
}) {
	const value = flag.get()
	return (
		<TldrawUiMenuCheckboxItem
			id={flag.name}
			title={flag.name}
			label={flag.name
				.replace(/([a-z0-9])([A-Z])/g, (m) => `${m[0]} ${m[1].toLowerCase()}`)
				.replace(/^[a-z]/, (m) => m.toUpperCase())}
			checked={value}
			onSelect={() => {
				flag.set(!value)
				onChange?.(!value)
			}}
		/>
	)
})

let t = 0

function createNShapes(editor: Editor, n: number) {
	const shapesToCreate: TLShapePartial[] = Array(n)
	const cols = Math.floor(Math.sqrt(n))

	for (let i = 0; i < n; i++) {
		t++
		shapesToCreate[i] = {
			id: createShapeId('box' + t),
			type: 'geo',
			x: (i % cols) * 132,
			y: Math.floor(i / cols) * 132,
		}
	}

	editor.batch(() => {
		editor.createShapes(shapesToCreate).setSelectedShapes(shapesToCreate.map((s) => s.id))
	})
}