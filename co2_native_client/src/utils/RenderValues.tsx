// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

/* eslint-disable react/prop-types */
import { Text } from 'react-native';

export const MaybeIfValue: React.FC<{text: string, value: any, suffix?: string}> = ({text, value, suffix}) => {
  if (value === undefined) {
    // console.error("value missing?");
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

export const MaybeIfValueTrue: React.FC<{text: string, value: any, suffix?: string}> = ({text, value, suffix}) => {
  if (value === undefined) {
    // console.error("value missing?");
    return null;
  }
  if (value === null) {
    return null;
  }
  if (!value) {
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
    // console.error("value missing?");
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
  