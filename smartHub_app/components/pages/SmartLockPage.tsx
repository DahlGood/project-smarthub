import React, {Component} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Dimensions} from 'react-native';
import { ColorPicker } from 'react-native-color-picker'
import hexRgb from 'hex-rgb';
import Toast, {BaseToast} from 'react-native-toast-message';
import axios from 'axios';
import {getAddressString} from '../../utils/utilities';
import LockModal from '../modals/modalForLockTimerConfiguration';

var width : number = Dimensions.get('window').width;
var height : number = Dimensions.get('window').height;

export default class SmartLock extends Component<{navigation: any, route: any},{deviceIP: string, device_id: number, selectedSeconds: number}>{

    constructor(props: any){
        super(props);
        this.state = ({
            deviceIP: "",
            device_id: this.props.route.params.device_id,
            selectedSeconds: 0
        });
        this.launchModal = this.launchModal.bind(this);

        
    }

    launchModal = () => {
        this.refs.LockModal.showModal();
    }

    getLockTime = (seconds: any) => {
        this.setState({selectedSeconds: seconds});
     }
  


    lock = () => {
        if(this.state.deviceIP !== "lukessmarthub.ddns.net"){
            alert(this.props.route.params.device_name + ' not compatible as a smart light device.')
            return;
        }

        axios.post('http://' + this.state.deviceIP + ':4000/lock/lock').then((response) => {
            console.log(response.data);
        }, (error) => {
            console.log(error);
        })
    }

    unlock = () => {
        if(this.state.deviceIP !== "lukessmarthub.ddns.net"){
            alert(this.props.route.params.device_name + ' not compatible as a smart light device.')
            return;
        }

        let collection: any = {}
        collection.lockTimeout = this.state.selectedSeconds;
        console.log(collection);
        axios.post('http://' + this.state.deviceIP + ':4000/lock/unlock', collection).then((response) => {
            console.log(response.data);
        }, (error) => {
            console.log(error);
        })
    }

    getDeviceIP = async () => {
        let collection: any = {}
        collection.device_id = this.props.route.params.device_id;
        await axios.post(getAddressString() + '/devices/getDeviceInfo', collection).then((response) => {
            //console.log(response.data);
            this.setState({deviceIP: response.data.device[0].device_address})
        }, (error) => {
            console.log(error);
        })
    }

    componentDidMount = () => {
        this.props.navigation.setOptions({
            headerTitle: this.props.route.params.device_name,
            headerLeft: () => 
            <View>
                <TouchableOpacity
                    onPress={()=>{this.props.navigation.navigate('Smart Lock Devices')}}>
                <Text style={{paddingLeft: 20, paddingBottom: 10, fontSize:15, fontWeight: 'bold'}}>Back</Text>
                </TouchableOpacity>
            </View>
        })
        this.getDeviceIP();
    }

    render(){
        return(
            <View style={{flex:1, backgroundColor: '#222222', paddingTop: 20, alignItems: 'center'}}>
                
                <TouchableOpacity
                    style={styles.button}
                    onPress={this.lock}>
                    <Text style={styles.text}>Lock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={this.unlock}>
                    <Text style={styles.text}>Unlock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={this.launchModal}>
                    <Text style={styles.text}>Configure Time</Text>
                </TouchableOpacity>
                <LockModal ref={'LockModal'} lockTime={this} device_id={this.state.device_id}/>
          </View>
        )
    }
}

const styles = StyleSheet.create ({

    button: {
        backgroundColor: '#222222',
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        borderRadius: 20,
        width: width-120,
        margin: 10,
        borderWidth: 2,
        borderColor: "#ffa31a",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1.00,
        shadowRadius: 10,
        elevation: 10,
    },

    text: {
        color: '#fff',
        fontSize: 20,
    }
})