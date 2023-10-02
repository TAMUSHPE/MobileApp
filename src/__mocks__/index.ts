import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert');
jest.mock("@react-native-async-storage/async-storage");
