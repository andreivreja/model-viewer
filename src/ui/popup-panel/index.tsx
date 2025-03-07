import React from 'react';
import { Observer } from '@playcanvas/observer';
import { Button } from 'pcui';
import { SetProperty, ObserverData } from '../../types';
import AnimationControls from './animation-controls';
import { CameraPanel, LightingPanel, ShowPanel, ViewPanel } from './panels';
// @ts-ignore no type defs included
import { UsdzExporter } from 'playcanvas-extras';
import { addEventListenerOnClickOnly } from '../../helpers';

const PopupPanelControls = (props: { observerData: ObserverData, setProperty: SetProperty }) => {
    return (<>
        <CameraPanel setProperty={props.setProperty} observerData={props.observerData} />
        <ShowPanel setProperty={props.setProperty} showData={props.observerData.show} uiData={props.observerData.ui} />
        <LightingPanel setProperty={props.setProperty} lightingData={props.observerData.lighting} uiData={props.observerData.ui} />
        <ViewPanel setProperty={props.setProperty} glbUrl={props.observerData.glbUrl} uiData={props.observerData.ui} />
    </>);
};

class PopupButtonControls extends React.Component <{ observerData: ObserverData, setProperty: SetProperty }> {
    popupPanelElement: any;
    render() {
        let removeDeselectEvents: any;
        const handleClick = (value: string) => {
            this.props.setProperty('ui.active', this.props.observerData.ui.active === value ? null : value);

            // after a popup button is set active, listen for another click outside the panel to deactivate it
            if (!this.popupPanelElement) this.popupPanelElement = document.getElementById('popup');
            // add the event listener after the current click is complete
            setTimeout(() => {
                if (removeDeselectEvents) removeDeselectEvents();
                const deactivateUi = (e: any) => {
                    if (this.popupPanelElement.contains(e.target)) {
                        return;
                    }
                    this.props.setProperty('ui.active', null);
                    removeDeselectEvents();
                    removeDeselectEvents = null;
                };
                removeDeselectEvents = addEventListenerOnClickOnly(document.body, deactivateUi, 4);
            });
        };

        const buildClass = (value: string) => {
            return (this.props.observerData.ui.active === value) ? ['popup-button', 'selected'] : 'popup-button';
        };

        return (
            <div id='popup-buttons-parent'>
                <AnimationControls animationData={this.props.observerData.animation} setProperty={this.props.setProperty} />
                <Button class={buildClass('camera')} icon='E212' width={40} height={40} onClick={() => handleClick('camera')} />
                <Button class={buildClass('show')} icon='E188' width={40} height={40} onClick={() => handleClick('show')} />
                <Button class={buildClass('lighting')} icon='E192' width={40} height={40} onClick={() => handleClick('lighting')} />
                <Button class={buildClass('view')} icon='E301' width={40} height={40} onClick={() => handleClick('view')} />
            </div>
        );
    }
}

const toggleCollapsed = () => {
    document.getElementById('panel-left').classList.toggle('collapsed');
    const observer: Observer = (window.observer as any);
    if (observer) observer.emit('canvasResized');
};

class PopupPanel extends React.Component <{ observerData: ObserverData, setProperty: SetProperty }> {
    link: HTMLAnchorElement;
    usdzExporter: any;

    get hasArSupport() {
        return this.props.observerData.xrSupported || this.usdzExporter;
    }

    constructor(props: any) {
        super(props);
        this.link = (document.getElementById('ar-link') as HTMLAnchorElement);
        if (this.link.relList.supports("ar") || (Boolean(window.webkit?.messageHandlers) && Boolean(/CriOS\/|EdgiOS\/|FxiOS\/|GSA\/|DuckDuckGo\//.test(navigator.userAgent)))) {
            // @ts-ignore
            this.usdzExporter = new UsdzExporter();
        }
    }

    render() {
        return (<div id='popup' className={this.props.observerData.scene.nodes === '[]' ? 'empty' : null}>
            <PopupPanelControls observerData={this.props.observerData} setProperty={this.props.setProperty} />
            <PopupButtonControls observerData={this.props.observerData} setProperty={this.props.setProperty} />
            <div id='floating-buttons-parent'>
                <Button class='popup-button' icon='E189' hidden={!this.hasArSupport || this.props.observerData.scene.nodes === '[]'} width={40} height={40} onClick={() => {
                    if (this.usdzExporter) {
                        const sceneRoot = (window as any).viewer.app.root.findByName('sceneRoot');
                        // convert the loaded entity into asdz file
                        this.usdzExporter.build(sceneRoot).then((arrayBuffer: any) => {
                            const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
                            this.link.href = URL.createObjectURL(blob);
                            this.link.click();
                        }).catch(console.error);
                    } else {
                        if (window.viewer) window.viewer.startXr();
                    }
                } } />
                <Button class='popup-button' id='fullscreen-button' icon='E127' width={40} height={40} onClick={() => {
                    toggleCollapsed();
                } } />
            </div>
        </div>);
    }
}

export default PopupPanel;
