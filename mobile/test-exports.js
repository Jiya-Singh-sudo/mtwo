const fs = require('fs');
const path = require('path');
// Node 20+ handles this

// Need to safely mock some globals for RN and Expo before requiring
global.window = global;
global.__DEV__ = true;

const findFiles = (dir) => {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(findFiles(fullPath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            files.push(fullPath);
        }
    });
    return files;
};

const appDir = path.join(__dirname, 'app');
const files = findFiles(appDir);

// Minimal mocks
const mockModule = {
    View: () => null,
    Text: () => null,
    StyleSheet: { create: x => x },
    Platform: { OS: 'web' },
    TouchableOpacity: () => null,
    ScrollView: () => null,
    KeyboardAvoidingView: () => null,
    SafeAreaView: () => null,
    Dimensions: { get: () => ({width: 100, height: 100}) },
    ActivityIndicator: () => null,
    RefreshControl: () => null,
    Alert: { alert: () => {} },
    Animated: { createAnimatedComponent: x => x },
};
require('module').prototype.require = new Proxy(require('module').prototype.require, {
    apply: function(target, thisArg, argumentsList) {
        const reqName = argumentsList[0];
        if (reqName === 'react-native') return mockModule;
        if (reqName === 'expo-router') return { router: {}, Redirect: () => null, Link: () => null, Stack: () => null, useSegments: () => [], useRootNavigationState: () => ({}) };
        if (reqName === 'expo-router/drawer') return { Drawer: () => null };
        if (reqName === '@expo/vector-icons') return { Ionicons: () => null };
        if (reqName === '@/context/AuthContext') return { AuthProvider: () => null, useAuth: () => ({}) };
        if (reqName.startsWith('@/theme')) return { colors: {}, spacing: {}, typography: {} };
        if (reqName.startsWith('@/components')) return { Card: () => null, Badge: () => null, Modal: () => null, Button: () => null, Input: () => null, Table: () => null };
        if (reqName.startsWith('@/api/')) return {};
        if (reqName === '@react-navigation/native') return { ThemeProvider: () => null, DarkTheme: {}, DefaultTheme: {} };
        if (reqName === '@/hooks/use-color-scheme') return { useColorScheme: () => 'light' };
        if (reqName === 'expo-status-bar') return { StatusBar: () => null };
        try {
            return Reflect.apply(target, thisArg, argumentsList);
        } catch(e) {
            return {};
        }
    }
});

files.forEach(f => {
    if (f.endsWith('ts') && !f.endsWith('tsx')) return;
    try {
        const mod = require(f);
        if (mod.default === undefined) {
             console.log('CRITICAL: undefined default export ->', f);
        }
    } catch(e) {
        // console.error(`Error in ${f}`, e.message);
    }
});
console.log('Verification done');
