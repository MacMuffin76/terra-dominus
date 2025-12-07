import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardActions, CardContent, CircularProgress, Grid, TextField, Typography, Snackbar, Link, FormControlLabel, Checkbox } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { fetchShopItems, purchaseItem } from '../api/shop';

const currencies = {
  EUR: '€',
  USD: '$',
  GBP: '£'
};

const formatPrice = (priceCents, currency) => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });
  return formatter.format(priceCents / 100);
};

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Shop = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantityById, setQuantityById] = useState({});
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });
  const [consentVersion] = useState('1.0');
  const [legalConsent, setLegalConsent] = useState({ cgv: true, cgu: true, refund: true, rgpd: true });

  useEffect(() => {
    setLoading(true);
    fetchShopItems()
      .then(setItems)
      .catch((err) => setToast({ open: true, severity: 'error', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => items.map((item) => {
    const qty = Number(quantityById[item.id] || 1);
    return {
      id: item.id,
      total: qty * item.priceCents,
      currency: item.currency,
    };
  }), [items, quantityById]);

  const handlePurchase = async (item) => {
    const qty = Number(quantityById[item.id] || 1);
    if (!legalConsent.cgv || !legalConsent.cgu || !legalConsent.refund || !legalConsent.rgpd) {
      setToast({ open: true, severity: 'warning', message: 'Merci de valider les documents légaux avant paiement.' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        itemId: item.id,
        quantity: qty,
        consentVersion,
        legalDocuments: legalConsent
      };
      const response = await purchaseItem(payload);
      setToast({ open: true, severity: 'success', message: `Paiement initié (${response.paymentIntentId})` });
    } catch (error) {
      setToast({ open: true, severity: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Boutique</Typography>
      <Typography variant="body1" paragraph>
        Les prix sont affichés dans votre devise locale. Plafond quotidien : 500€ équivalent.
      </Typography>

      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        {['cgv', 'cgu', 'refund', 'rgpd'].map((key) => (
          <FormControlLabel
            key={key}
            control={(
              <Checkbox
                checked={Boolean(legalConsent[key])}
                onChange={(e) => setLegalConsent({ ...legalConsent, [key]: e.target.checked })}
              />
            )}
            label={`J'accepte ${key.toUpperCase()}`}
          />
        ))}
      </Box>
      <Typography variant="body2" paragraph>
        Veuillez lire et accepter les documents légaux avant de finaliser un achat :
        {' '}<Link href="/legal/cgv.md" target="_blank" rel="noopener">CGV</Link>,
        {' '}<Link href="/legal/cgu.md" target="_blank" rel="noopener">CGU</Link>,
        {' '}<Link href="/legal/mentions-legales.md" target="_blank" rel="noopener">Mentions légales</Link>,
        {' '}<Link href="/legal/politique-remboursement.md" target="_blank" rel="noopener">Remboursement</Link>,
        {' '}<Link href="/legal/politique-rgpd.md" target="_blank" rel="noopener">RGPD</Link>.
      </Typography>

      {loading && items.length === 0 ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => {
            const total = totals.find((t) => t.id === item.id);
            return (
              <Grid item xs={12} md={4} key={item.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="textSecondary">{item.description}</Typography>
                    <Typography variant="h5" mt={2}>{formatPrice(item.priceCents, item.currency)} {currencies[item.currency]}</Typography>
                    <Box mt={1}>
                      <TextField
                        label="Quantité"
                        type="number"
                        value={quantityById[item.id] || 1}
                        onChange={(e) => setQuantityById({ ...quantityById, [item.id]: e.target.value })}
                        inputProps={{ min: 1 }}
                        size="small"
                      />
                    </Box>
                    <Typography variant="subtitle2" mt={1}>Total : {formatPrice(total?.total || 0, item.currency)}</Typography>
                  </CardContent>
                  <CardActions>
                    <Button variant="contained" color="primary" onClick={() => handlePurchase(item)} disabled={loading}>
                      Acheter
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Shop;