import React from 'react';
import {
    GLTFLoader,
} from 'three/examples/jsm/loaders/GLTFLoader';
import AbstractObject from "../../abstract/AbstractObject";
import {
    AnimationMixer,
} from 'three';

class GLTF extends AbstractObject {

    constructor() {
        super();
        this.mixer = null;
        this.currentAnimation = null;
        this.clips = [];
    }

    getClipByName = (clipName) => {
        return this.clips.filter((el) => {return el.name === clipName})[0];
    };

    setAnimation = (animation) => {
        if (!animation) return;
        const {clipName} = animation;
        if (!clipName) return;
        const clip = this.getClipByName(clipName);
        if (clip) {
            this.mixer.stopAllAction();
            this.mixer.clipAction(clip).play();
        }
    };

    componentDidMount() {
        const {
            //
            scene,
            addRenderCall,
            enableShadows,
            //
            url=null, // required!!!
            position=[0, 0, 0],
            rotation=[0, 0, 0],
            scale=[1, 1, 1],
            onLoadComplete=null,
            animation=null,
            visible=true,
        } = this.props;
        this.initComponent();
        let loader = new GLTFLoader();
        loader.crossOrigin = true;
        loader.load(url, (data) => {
            this.obj = data.scene;
            this.obj.visible = visible;
            this.setPosition(position);
            this.setRotation(rotation);
            this.obj.scale.set(...scale);
            this.obj.name = this.name;
            // console.log(this.obj);


            // this.obj.traverse( function( node ) {
            //     if (node instanceof Mesh) {
            //         node.scale.set(...scale);
            //     }
            // });
            if (enableShadows) {
                this.obj.traverse( function ( node ) {
                    // console.log('xx', node);
                    if ( node.isMesh || node.isLight ) {
                        // console.log('ok');
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
            }
            scene.add(this.obj);
            this.uuid = this.obj.uuid;

            this.obj.castShadow = enableShadows;
            this.obj.receiveShadow = enableShadows;

            this.mixer = new AnimationMixer(this.obj);
            this.clips = data.animations;
            this.setAnimation(animation);
            // data.animations.forEach((clip) => {
            //     console.log('ccc', clip);
            //     // if (clip.name === 'man_run_root') {
            //     // if (clip.name === 'man_walk_in_place') {
            //     //     this.mixer.clipAction(clip).play();
            //     // }
            // });

            addRenderCall((deltaSeconds) => {
                this.mixer.update( deltaSeconds );
                // this.mixer.update();
            });
            //
            this.readyComponent();
            // fire loaded object
            if (onLoadComplete) {onLoadComplete()}
        });
    }

    shouldComponentUpdate(nextProps) {
        const {
            animation,
            selectedMaterial = null,
        } = this.props;
        // console.log('nextProps', nextProps);
        if (nextProps.animation && nextProps.animation.clipName) {
            if (!animation || animation.clipName !== nextProps.animation.clipName) {
                this.setAnimation({
                    clipName: nextProps.animation.clipName,
                })
            }
        }
        // override materials
        if (nextProps.materials) {
            if (nextProps.selectedMaterial !== selectedMaterial) {
                const newMaterials = nextProps.materials[nextProps.selectedMaterial];
                this.obj.traverse( ( node ) => {
                    if (node.isMesh) {
                        // console.log('node.material.name', node.material.name);
                        if (node.material && Object.keys(newMaterials).includes(node.material.name)) {
                            node.material = newMaterials[node.material.name];
                            node.material.needsUpdate = true;
                        }
                    }
                });
            }
        }
        this.onPropsUpdate(this.props, nextProps);
        return true
    }
}

export default GLTF;
