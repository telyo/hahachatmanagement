import { useState } from 'react';
import { useInput, InputProps } from 'react-admin';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * 自定义密码输入组件，支持显示/隐藏密码
 */
export const PasswordInputWithToggle = (props: InputProps & { fullWidth?: boolean; defaultValue?: string }) => {
  const {
    source,
    label,
    helperText,
    fullWidth,
    required,
    disabled,
    defaultValue,
    ...rest
  } = props;
  
  const {
    field,
    fieldState: { error, invalid },
    formState: { isSubmitted },
  } = useInput({ source, defaultValue, ...rest });

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <TextField
      {...field}
      type={showPassword ? 'text' : 'password'}
      label={label}
      helperText={helperText || (invalid && isSubmitted ? error?.message : undefined)}
      error={invalid && isSubmitted}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="切换密码可见性"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

