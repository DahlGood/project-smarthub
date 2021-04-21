import React, {Component} from 'react';
import {StyleSheet, Text, Dimensions, Platform, TouchableOpacity} from 'react-native';
import Modal from 'react-native-modalbox';
import Toast from 'react-native-toast-message';
import getToastConfig from '../configurations/toastConfig';
import ImagePickerPage from '../pages/ImagePickerPage';

var screen = Dimensions.get('window');

//Need to create the interfaces to define the types for props and state variables
interface PropVariables{
    navigation: any,
    routeObject: any,
    parentFlatList: any
}

interface StateVariables{
    facialRecognition: string,
}

export default class FacialRecognitionModal extends Component<PropVariables, StateVariables>{
    constructor(props: any){
        super(props);
        this.state = ({
            facialRecognition: '',
        })
    }

    showModal = () => {
        this.refs.facialRecognitionModal.open(); 
    }

    render(){
      
        return(
            
            <Modal
                ref={"facialRecognitionModal"} 
                style={styles.modalStyling}
                position='center'
                backdrop={true}   
            >
                <Text style={{
                    fontSize: screen.width/20,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    paddingBottom: 15,
                    color: "#fff"
                }}>Add a face to be recognized: </Text>
                <TouchableOpacity 
                    style={styles.buttonStyle}
                    onPress={() => ImagePickerPage(this, this.props.routeObject, this.props.parentFlatList)}>
                    <Text style={{ paddingTop: 2, textAlign: 'center', fontWeight: 'bold', fontSize: screen.width/26, color: '#fff'}}>Upload from Camera Roll</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.buttonStyle}
                    onPress={() => this.props.navigation.navigate('Image Capture Devices', this.props.routeObject)}>
                <Text style={{ paddingTop: 2, textAlign: 'center', fontWeight: 'bold', fontSize: screen.width/26, color: '#fff'}}>Take Photo</Text>
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
        width: screen.width/2,
        backgroundColor: '#E0A458'
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
        alignItems: 'center',
        shadowRadius: 10,
        width: screen.width - 80,
        height: screen.height/3,
        backgroundColor: '#1C1D2B',
        borderColor: '#E0A458',
        borderWidth: 2,
    }
})
