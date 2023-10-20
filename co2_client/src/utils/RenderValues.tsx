// Web versions of the helpful native "Maybe..." helpers.
export const MaybeIfValueNot: React.FC<{text: string | null, value: any, compareAgainst: any, suffix?: string}> = ({text, value, compareAgainst, suffix}) => {
    if (value === undefined) {
      // console.error("value missing?");
      return null;
    }
    if (value === null) {
      return null;
    }
  
    if (value === compareAgainst) {
      return null;
    }
    return (
        <>
            {text}{value}{suffix}
        </>
    );
  }
  