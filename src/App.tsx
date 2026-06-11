import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import TaskListScreen from './screens/TaskListScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Tasks" options={{ title: 'My Tasks' }}>
              {(props) => <TaskListScreen {...props} user={user} onLogout={() => signOut(auth)} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
            <Stack.Screen name="PasswordReset" component={PasswordResetScreen} options={{ title: 'Reset Password' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
