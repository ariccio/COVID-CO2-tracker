import { Text } from 'react-native';

export const MaybeIfValue: React.FC<{text: string, value: any, suffix?: string}> = ({text, value, suffix}) => {
    if (value === undefined) {
      console.error("value missing?");
      return null;
    }
    if (value === null) {
      return null;
    }
    return (
      <Text>
          {text}{value}{suffix}
      </Text>
    );
  }
  
  
export const ValueOrLoading: React.FC<{text: string, value: any, suffix?: string}> = ({text, value, suffix}) => {
    if (value === undefined) {
      console.error("value missing?");
      return null;
    }
    if (value === null) {
      return (
        <Text>
            Loading {text}...
        </Text>
      );
      }
    return (
      <Text>
          {text}{value}{suffix}
      </Text>
    );
  }
  