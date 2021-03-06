/* eslint-disable camelcase */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  KeyboardAvoidingView,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';

import api from '../../services/api';

import Input from '../../components/Input';
import Button from '../../components/Button';
import logoImg from '../../assets/logo.png';

import { useAuth } from '../../hooks/Auth';
import getValidationErrors from '../../utils/getValidationErrors';

import { Container, Title, LoadingView } from './styles';

interface SignInFormData {
  username: string;
  password: string;
}

interface SignInRequestToken {
  data: { request_token: string };
}

const SignIn: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation();
  const passwordInputRef = useRef<TextInput>(null);
  const formRef = useRef<FormHandles>(null);

  const { user, signIn } = useAuth();

  useEffect(() => {
    () => user && navigation.navigate('Main');
  }, [user, navigation]);

  const handleSignIn = useCallback(
    async (data: SignInFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          username: Yup.string().required('Usuário obrigatório'),
          password: Yup.string().required('Senha obrigatória'),
        });

        await schema.validate(data, { abortEarly: false });
        // eslint-disable-next-line camelcase
        setLoading(true);

        const {
          data: { request_token },
        }: SignInRequestToken = await api.get('/authentication/token/new');

        await signIn({
          username: data.username,
          password: data.password,
          request_token,
        });

        setLoading(false);
        navigation.navigate('Main');
      } catch (err) {
        setLoading(false);

        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);

          return;
        }
        console.log(err.status_message);

        Alert.alert(
          'Erro na autenticação',
          'Ocorreu um erro ao fazer login, cheque as credenciais',
        );
      }
    },
    [signIn, navigation],
  );

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} enabled>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flex: 1 }}
        >
          <Container>
            <LoadingView transparent animationType="slide" visible={loading}>
              <ActivityIndicator
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                animating={loading}
                size="large"
                color="#00ff00"
              />
            </LoadingView>
            <Image source={logoImg} />
            <View>
              <Title>Faça seu logon</Title>
            </View>

            <Form
              ref={formRef}
              onSubmit={handleSignIn}
              style={{ width: '100%' }}
            >
              <Input
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                icon="user"
                name="username"
                placeholder="Usuário"
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
              />
              <Input
                ref={passwordInputRef}
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={() => {
                  formRef.current?.submitForm();
                }}
                icon="lock"
                name="password"
                placeholder="Senha"
              />

              <Button
                onPress={() => {
                  formRef.current?.submitForm();
                }}
              >
                Entrar
              </Button>
            </Form>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignIn;
