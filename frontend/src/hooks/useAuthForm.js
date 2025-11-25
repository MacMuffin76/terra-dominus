import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, registerUser } from '../redux/authSlice';

const RESERVED_USERNAMES = ['admin', 'root', 'system'];

const delay = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration));

const buildDefaultValues = (mode) =>
  mode === 'register'
    ? { username: '', email: '', password: '' }
    : { username: '', password: '' };

const buildHelperTexts = (mode) => ({
  username: '3 à 20 caractères, lettres, chiffres ou underscore.',
  email: 'Adresse valide requise pour les notifications et la récupération.',
  password:
    mode === 'register'
      ? '8 caractères minimum, dont une majuscule et un chiffre.'
      : 'Utilisez votre mot de passe exact, sensible à la casse.',
});

const useAuthForm = (mode = 'login') => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [values, setValues] = useState(buildDefaultValues(mode));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [validatingFields, setValidatingFields] = useState({});

  const defaultValues = useMemo(() => buildDefaultValues(mode), [mode]);
  const helperTexts = useMemo(() => buildHelperTexts(mode), [mode]);
  const watchedFields = useMemo(
    () => (mode === 'register' ? ['username', 'email', 'password'] : ['username', 'password']),
    [mode]
  );

  useEffect(() => {
    setValues(defaultValues);
    setErrors({});
    setStatus('idle');
    setValidatingFields({});
  }, [defaultValues]);

  useEffect(() => {
    if (authState.error) {
      setErrors((prev) => ({ ...prev, server: authState.error.message || 'Une erreur est survenue.' }));
      setStatus('error');
    }
  }, [authState.error]);

  const runSyncValidations = useCallback(
    (name, value) => {
      if (name === 'username') {
        if (!value) return 'Le nom d’utilisateur est requis.';
        if (value.trim().length < 3) return 'Au moins 3 caractères sont requis.';
        if (!/^\w{3,20}$/.test(value)) return 'Utilisez uniquement des lettres, chiffres ou underscores.';
      }

      if (name === 'email' && mode === 'register') {
        if (!value) return "L'email est requis.";
        const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
        if (!emailPattern.test(value)) return 'Format d’email invalide.';
      }

      if (name === 'password') {
        if (!value) return 'Le mot de passe est requis.';
        if (mode === 'register' && value.length < 8) return '8 caractères minimum.';
        if (mode === 'register' && !/(?=.*[A-Z])(?=.*[0-9])/.test(value))
          return 'Ajoutez une majuscule et un chiffre.';
      }

      return null;
    },
    [mode]
  );

  const runAsyncValidations = useCallback(
    async (name, value) => {
      if (!value) return null;

      if (name === 'username' && mode === 'register') {
        setValidatingFields((prev) => ({ ...prev, username: true }));
        await delay();
        setValidatingFields((prev) => ({ ...prev, username: false }));
        if (RESERVED_USERNAMES.includes(value.trim().toLowerCase())) {
          return 'Ce nom est déjà réservé.';
        }
      }

      if (name === 'email' && mode === 'register') {
        setValidatingFields((prev) => ({ ...prev, email: true }));
        await delay(280);
        setValidatingFields((prev) => ({ ...prev, email: false }));
        if (value.toLowerCase().endsWith('@example.com')) {
          return 'Merci d’utiliser votre vraie adresse email.';
        }
      }

      return null;
    },
    [mode]
  );

  const updateFieldError = useCallback((name, message) => {
    setErrors((prev) => {
      if (!message) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: message };
    });
  }, []);

  const validateField = useCallback(
    async (name, value) => {
      const syncError = runSyncValidations(name, value);
      if (syncError) {
        updateFieldError(name, syncError);
        return false;
      }

      updateFieldError(name, null);

      const asyncError = await runAsyncValidations(name, value);
      if (asyncError) {
        updateFieldError(name, asyncError);
        return false;
      }

      return true;
    },
    [runAsyncValidations, runSyncValidations, updateFieldError]
  );

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev.server) return prev;
      const { server, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleBlur = useCallback(
    async (event) => {
      const { name, value } = event.target;
      if (watchedFields.includes(name)) {
        await validateField(name, value);
      }
    },
    [validateField, watchedFields]
  );

  const validateAllFields = useCallback(async () => {
    const validationResults = await Promise.all(
      watchedFields.map((field) => validateField(field, values[field]))
    );
    return validationResults.every(Boolean);
  }, [validateField, values, watchedFields]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setErrors((prev) => {
        const { server, ...rest } = prev;
        return rest;
      });
      setStatus('pending');

      const isValid = await validateAllFields();
      if (!isValid) {
        setStatus('error');
        return;
      }

      const payload =
        mode === 'login'
          ? { username: values.username, password: values.password }
          : { username: values.username, email: values.email, password: values.password };

      const actionCreator = mode === 'login' ? login : registerUser;
      const resultAction = await dispatch(actionCreator(payload));

      if (actionCreator.fulfilled.match(resultAction)) {
        setStatus('success');
        updateFieldError('server', null);
      } else {
        setStatus('error');
        const message = resultAction.payload?.message || 'Impossible de valider le formulaire.';
        updateFieldError('server', message);
      }
    },
    [dispatch, mode, updateFieldError, validateAllFields, values]
  );

  const helperTextFor = useCallback(
    (name) => {
      if (errors[name]) return errors[name];
      if (validatingFields[name]) return 'Validation en cours…';
      return helperTexts[name];
    },
    [errors, helperTexts, validatingFields]
  );

  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': Boolean(errors[name]),
    }),
    [errors, handleBlur, handleChange, values]
  );

  const serverError = errors.server;
  const isBusy =
    status === 'pending' ||
    authState.loading ||
    Object.values(validatingFields).some(Boolean);

  return {
    authState,
    errors,
    status,
    helperTextFor,
    getFieldProps,
    handleSubmit,
    serverError,
    isBusy,
    validatingFields,
  };
};

export default useAuthForm;