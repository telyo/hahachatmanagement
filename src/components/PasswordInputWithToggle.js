import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useInput } from 'react-admin';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
/**
 * 自定义密码输入组件，支持显示/隐藏密码
 */
export const PasswordInputWithToggle = (props) => {
    const { source, label, helperText, fullWidth, required, disabled, defaultValue, ...rest } = props;
    const { field, fieldState: { error, invalid }, formState: { isSubmitted }, } = useInput({ source, defaultValue, ...rest });
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    return (_jsx(TextField, { ...field, type: showPassword ? 'text' : 'password', label: label, helperText: helperText || (invalid && isSubmitted ? error?.message : undefined), error: invalid && isSubmitted, required: required, disabled: disabled, fullWidth: fullWidth, InputProps: {
            endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { "aria-label": "\u5207\u6362\u5BC6\u7801\u53EF\u89C1\u6027", onClick: handleClickShowPassword, onMouseDown: handleMouseDownPassword, edge: "end", children: showPassword ? _jsx(VisibilityOff, {}) : _jsx(Visibility, {}) }) })),
        } }));
};
