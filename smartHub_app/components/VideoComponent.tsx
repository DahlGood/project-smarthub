import React, {Component} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import { DevicesList } from './lists/DevicesList';
import { PlayVideos } from './lists/SavedRecordings';
import { SavedRecordingsList } from './lists/SavedRecordingsList';
import { SavedImagesList } from './lists/SavedImagesList';

export class LiveRecordingDevices extends Component<{route: any, navigation: any}>{
    render(){
        return (
            <DevicesList routeObject={this.props.route.params} stackScreen={'Recording Devices'} navigation={this.props.navigation}/>
        )
    }
}
export class LiveIntercomDevices extends Component<{route: any, navigation: any}>{
    render(){
        return (
            <DevicesList routeObject={this.props.route.params} stackScreen={'Intercom Devices'} navigation={this.props.navigation}/>
        )
    }
}

export class ImageCaptureDevices extends Component<{route: any, navigation: any}>{
    render(){
        return (
            <DevicesList routeObject={this.props.route.params} stackScreen={'Take Photo'} navigation={this.props.navigation}/>
        )
    }
}

export class SavedRecordings extends Component<{routeObject: any, navigation: any}>{
    render(){
        return (
            <SavedRecordingsList routeObject={this.props.routeObject.params} navigation={this.props.navigation}/>
        );
    }
}

export class SavedImages extends Component<{routeObject: any, navigation: any}>{
    render(){
        return (
            <SavedImagesList routeObject={this.props.routeObject.params} navigation={this.props.navigation}/>
        );
    }
}
