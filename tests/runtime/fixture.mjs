export function createMinimalLibrary() {
  const card = (text, answer) => ({
    text,
    answer,
    imageMedia: {},
    audioMedia: {},
    tips: { front: '', back: '' },
  });

  return {
    library: 'H5P.DialogcardsPapiJo 1.17',
    params: {
      title: 'Runtime contract fixture',
      description: 'Two cards for the lifecycle smoke test.',
      dialogs: [
        card('Alpha', 'A'),
        card('Bravo', 'B'),
      ],
      behaviour: {
        enableRetry: true,
        noTextOnCards: false,
        hideTurnButton: false,
        scaleTextNotCard: false,
        playMode: 'normalMode',
        cardsOrderChoice: 'normal',
        enableCardsNumber: false,
        cardsSideChoice: 'frontFirst',
        penalty: 0,
        passPercentage: 100,
        noDupeFrontPicToBack: false,
        filterByCategories: 'none',
      },
    },
  };
}
