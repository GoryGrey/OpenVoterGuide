(() => {
  const valueInput = document.querySelector("[data-levy-home-value]");
  if (!valueInput) return;

  const estimateTargets = Array.from(document.querySelectorAll("[data-levy-estimate]"));
  const status = document.querySelector("[data-levy-estimator-status]");
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  });

  const annualTaxAtRate = (marketValue, mills) => marketValue * 0.35 * mills / 1000;

  function describeEstimate(target, marketValue) {
    const rate = Number(target.dataset.rate);
    const existingRate = Number(target.dataset.existingRate || 0);
    const kind = target.dataset.kind;
    const annualAtVotedRate = annualTaxAtRate(marketValue, rate);
    const valueText = money.format(marketValue);
    const monthly = annualAmount => money.format(annualAmount / 12);

    if (kind === "additional") {
      return `Estimated new tax: about ${money.format(annualAtVotedRate)} per year (about ${monthly(annualAtVotedRate)} per month when averaged across the year) for a ${valueText} property, before reductions.`;
    }

    if (kind === "renewal_increase") {
      const increase = annualTaxAtRate(marketValue, rate - existingRate);
      return `Estimated increase: about ${money.format(increase)} per year (about ${monthly(increase)} per month when averaged across the year) for a ${valueText} property. Total for this levy at ${rate} mills: about ${money.format(annualAtVotedRate)} per year, before reductions.`;
    }

    if (kind === "renewal_reduction") {
      const savings = annualTaxAtRate(marketValue, existingRate - rate);
      return `Estimated savings: about ${money.format(savings)} per year (about ${monthly(savings)} per month when averaged across the year) for a ${valueText} property. Total for this levy at ${rate} mills: about ${money.format(annualAtVotedRate)} per year, before reductions.`;
    }

    return `This is not a new charge. If renewed, about ${money.format(annualAtVotedRate)} per year (about ${monthly(annualAtVotedRate)} per month when averaged across the year) for a ${valueText} property would be associated with this levy at the full voted rate, before reductions.`;
  }

  function updateEstimates() {
    const marketValue = Number(valueInput.value);
    const valid = Number.isFinite(marketValue) && marketValue > 0;

    estimateTargets.forEach(target => {
      target.textContent = valid
        ? describeEstimate(target, marketValue)
        : "Enter a positive appraised market value to see an estimate.";
    });

    if (status) {
      status.textContent = valid
        ? `Estimates updated for a ${money.format(marketValue)} appraised value. Added amounts exclude existing levy portions; straight renewals are not new taxes.`
        : "Enter a positive appraised market value to update the estimates.";
    }
  }

  valueInput.addEventListener("input", updateEstimates);
  updateEstimates();
})();
