import React, {Component} from 'react';
import {StyleSheet, Text, TextInput, Dimensions, Platform} from 'react-native';
import Modal from 'react-native-modalbox';
import Button from 'react-native-button';
import axios from 'axios';
import { getAddressString } from '../../utils/utilities';
import { TouchableOpacity } from 'react-native-gesture-handler';
import ImagePickerPage from '../pages/ImagePickerPage';

var screen = Dimensions.get('window');

//Need to create the interfaces to define the types for props and state variables
interface PropVariables{
    parentFlatList: any,
    facialRecognitionsList: any,
    navigation: any,
    routeObject: any,
    
   // stackScreen: string
}

interface StateVariables{
    DeviceIP: string,
    facialRecognition: string,
}

export default class FacialRecognitionModal extends Component<PropVariables, StateVariables>{
    constructor(props: any){
        super(props);
        this.state = ({
            facialRecognition: '',
            DeviceIP: '',
        })
    }

    showModal = () => {
        this.refs.facialRecognitionModal.open(); 
    }

    render(){
        //console.log(this.props.routeObject.params.userEmail)
        var stackScreen = 'Take';

        return(
            <Modal
                ref={"facialRecognitionModal"} 
                style={styles.modalStyling}
                position='center'
                backdrop={true}   
            >
                <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    paddingBottom: 15
                }}>Add a face to be recognized: </Text>
                <TouchableOpacity 
                    style={styles.buttonStyle}
                    onPress={() => ImagePickerPage()}>
                    <Text style={{ paddingTop: 2, textAlign: 'center', fontWeight: 'bold', fontSize: 15, color: '#000'}}>Upload from Camera Roll</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.buttonStyle}
                    onPress={() => this.props.navigation.navigate('Image Capture Devices',this.props.routeObject)}>
                <Text style={{ paddingTop: 2, textAlign: 'center', fontWeight: 'bold', fontSize: 15, color: '#000'}}>Take Photo</Text>
                </TouchableOpacity>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    
    buttonStyle: {
        padding: 8,
        marginTop: 10,
        marginLeft: 70,
        marginRight: 70,
        marginBottom: 10,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#FF9900'
    },

    textInputStyling: {
        height: 40,
        borderBottomColor: 'gray',
        marginLeft: 30,
        marginRight: 30,
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1
    },

    modalStyling: {
        justifyContent: 'center',
        borderRadius: Platform.OS === 'ios' ? 30 : 0,
        shadowRadius: 10,
        width: screen.width - 80,
        height: 280
    }
})