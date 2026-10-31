const webRemoteData = {
  gb: {
    mtfMarginContent: {
      usedForMtf: 'Used for MTF',
      changeInHaircut: 'Uncollected haircut for MTF',
      mtfUnrealizedLoss: 'Unrealised MTF loss',
      mtfUnrealizedProfit: 'Unrealized MTF loss recovered',
      netMtfIntradayPnl: 'MTF Intraday Loss'
    },
    stockEquityOnHold: {
      text: 'Delivery sell balance blocked',
      popupHeader: 'Why is my sell amount blocked ?',
      popupText:
        'As per regulations, 20% of the demat sell amount will be released tonight & the rest 80% will be released in 30 mins except for BTST & pledge sell.'
    },
    toBeCredited: {
      BLOCK_TEXT_80: {
        PRIMARY_TEXT: '80% block for delivery sell',
        SECONDARY_TEXT: 'Available in 30 mins after transaction'
      },
      BLOCK_TEXT_20: {
        PRIMARY_TEXT: '20% block for delivery sell',
        SECONDARY_TEXT: 'Available by end of the day'
      },
      BLOCK_TEXT_MTF: {
        PRIMARY_TEXT: 'To be received from MTF',
        SECONDARY_TEXT: 'Available by end of the day'
      },
      PLEDGE_BT_ST: {
        PRIMARY_TEXT: 'Pledge or BTST sell',
        SECONDARY_TEXT: 'Available by end of the day'
      },
      POPOVER_CONTENT: {
        PRIMARY_TEXT:
          'BTST or Buy Today Sell Tomorrow is when you sell any stock you have bought on the previous trading/settlement day.'
      }
    }
  },
  stocks: {
    asbaCncPercentage: 0.013,
    cncPercentage: 0.0022,
    misPercentage: 0.0013,
    mtfPercentage: 0.002,
    amoMarketProtection: 0.045,
    amoLimitProtection: 0.020,
    prefferedExchange: 'NSE',
    cancelAndExitScreenTimeout: 2000,
    isExchangeToggleDisabled: false,
    isSquareOffModeDisabled: false,
    isFnoSquareOffModeDisabled: false,
    isExpiryDaySquareOffModeDisabled: false,
    exitAllOrderValidity: 'DAY',
    multiOrderRequestMaxOrdersLimit: 20,
    fnoNrmlPositionDropdownStoplossOption: 'GTT_OCO_ORDER',
    showFnoRiskCompliancePopup: true,
    shouldBlockOcoWithoutPosition: true,
    defaultFnoProduct: 'NRML',
    safeExitMarkupPercentage: 2,
    safeExitMinLossLimit: 100,
    showPrevSafeExitValOnLaunch: false,
    lppCheckHardBlocker: false,
    cashMaxSingleOrderAmountInRupees: 20000000,
    allowSocketOrderUpdates: true,
    isPreOpenAllowed: true,
    bseFnoOrderFeaturesStatus: {
      isBseFnoGttEnabled: true,
      isBseFnoOcoEnabled: true,
      isBseFnoIcebergEnabled: true,
      isBseFnoIntradayEnabled: true
    },
    stockMarketOrderProtection: {
      isNseEnabled: false,
      isBseEnabled: true,
      nseStoplossPercentage: 4.5,
      bseStoplossPercentage: 4.5,
      regularAmoOrderPercentage: 4.5
    },
    defaultFnoValues: {
      BANKNIFTY: {
        lotSize: 15,
        freezeQty: 900
      },
      NIFTY: {
        lotSize: 25,
        freezeQty: 1800
      },
      FINNIFTY: {
        lotSize: 40,
        freezeQty: 1800
      },
      1: {
        lotSize: 10,
        freezeQty: 1000
      },
      14: {
        lotSize: 15,
        freezeQty: 900
      },
      NIFTYMIDSELECT: {
        lotSize: 75,
        freezeQty: 2775
      },
      DEFAULT: {
        lotSize: 1,
        freezeQty: 20000
      }
    },
    basketOrder: {
      BANKNIFTY: {
        isAllowed: true,
        allowedRangePercentage: 100
      },
      NIFTY: {
        isAllowed: true,
        allowedRangePercentage: 100
      },
      FINNIFTY: {
        isAllowed: true,
        allowedRangePercentage: 100
      },
      NIFTYMIDSELECT: {
        isAllowed: true,
        allowedRangePercentage: 100
      },
      1: {
        isAllowed: true,
        allowedRangePercentage: 100
      },
      14: {
        isAllowed: true,
        allowedRangePercentage: 100
      },
      STOCKS: {
        isAllowed: true,
        allowedRangePercentage: 100
      }
    },
    marketOptionBuy: {
      minIndexOI: -1,
      minIndexVolume: -1,
      indexStrikeRange: 1,
      minStockOI: -1,
      minStockVolume: -1,
      stockStrikeRange: 2
    },
    amoDefaultOrderType: 'Limit',
    gttTriggerPriceBuffers: {
      BUFFER_LIMIT_FACTOR: 0.0025,
      BUFFER_LIMIT_VAL: 0.2
    },
    gttFnoTriggerPriceBuffers: {
      BUFFER_LIMIT_FACTOR: 0.0025,
      BUFFER_LIMIT_VAL: 0.2
    },
    gttOcoFnoTriggerPriceBuffers: {
      BUFFER_LIMIT_FACTOR: 0.0025,
      BUFFER_LIMIT_VAL: 0.25
    },
    pledge: {
      timings: {
        start: '06:00:00',
        close: '21:00:00'
      },
      validation: {
        pledge: 'Apply between 6AM - 9PM on trading days',
        unpledge: 'Apply during market hours'
      }
    },
    ipo: {
      order: {
        upiRejectedErrorText: 'UPI ID looks wrong, please check',
        toUseVpaListApi: true,
        toUseValidationVpaApi: true
      },
      noCancellationSymbols: [ 'RIIT', 'ANANTAM', 'CITIUSINVT', 'BAGMANE', 'CUBEINVIT' ]
    },
    mtf: {
      isMtfEnabled: true,
      reVerify: {
        reVerifyStartTime: 15,
        reVerifyEndTime: 20,
        text: 'Change in quantity. Verify by 08:00 PM today to avoid auto square-off.'
      },
      activationPopup: {
        videoUrl: {
          English: 'https://www.youtube.com/embed/WSkmKa2dJsI',
          Hindi: 'https://www.youtube.com/embed/i01BxmGVtdE'
        },
        content:
          'MTF allows you to buy stocks with partial funding from Groww, with a daily interest charged on the funded amount',
        tncUrl: 'https://groww.in/pages/terms-and-conditions-mtf'
      }
    },
    t2tMessage: 'This stock will be available to sell after delivery',
    t2tMessageInfo:
      'This stock has been listed as a trade-to-trade stock by the exchange. It will be available to sell after demat delivery i.e. 1 trading day after purchase.',
    t2tMessageHeader: 'Trade-to-trade stock',
    underLockIn: 'Lockin due to settlement holiday'
  },
  usStocks: {
    promotions: {
      showICICIBankOffer: false
    },
    tcs: {
      saveTcs: true,
      showExploreTcsbanner: true
    }
  },
  mf: {
    nomineeDobComplianceEnabled: false,
    nfo: {
      available: true,
      exclusive: {
        blogLink: 'https://groww.in/p/exclusive-funds',
        funds: [
          {
            fundName: 'Motilal Oswal Asset Allocation Passive FOF - Aggressive',
            pros: [ 'Indian Equity', 'International Equity', 'Debt', 'Gold' ],
            appLink:
              'https://groww.in/nfo/motilal-oswal-asset-allocation-passive-fund-of-fund-aggressive',
            searchId:
              'motilal-oswal-asset-allocation-passive-fund-of-fund-aggressive',
            closeOn: '05 March 2021'
          },
          {
            fundName:
              'Motilal Oswal Asset Allocation Passive FOF - Conservative',
            pros: [ 'Indian Equity', 'International Equity', 'Debt', 'Gold' ],
            appLink:
              'https://groww.in/nfo/motilal-oswal-asset-allocation-passive-fund-of-fund-conservative',
            searchId:
              'motilal-oswal-asset-allocation-passive-fund-of-fund-conservative',
            closeOn: '05 March 2021'
          }
        ]
      }
    },
    track: {
      CAMS_URL:
        'https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement'
    },
    sip: {
      editSipFeaturesEnabled: true,
      sipNavDeductionInfoEnabled: false
    },
    stpErrorValidationEnabled: true,
    isSmartSaveEnabled: true,
    isNomineeFlowEnabled: true,
    mfBlockKycPendingOrders: true,
    mfAllowedKraStatusMap: [
      'MODIFICATION_UNDER_PROCESS',
      'MODIFICATION_REGISTERED',
      'MODIFICATION_ON_HOLD',
      'MODIFICATION_REJECTED',
      'NOT_INITIATED',
      'REGISTERED',
      'VALIDATED'
    ],
    mfOrderStatusMap: {
      INITIATED_WITH_USER_ACTION: {
        statusText: 'Action pending',
        iconColorClass: 'contentWarning',
        icon: 'clock-time-four'
      },
      INITIATED_WITH_NO_USER_ACTION: {
        statusText: 'Initiated',
        iconColorClass: 'contentPositive',
        icon: 'clock-time-four'
      },
      IN_PROGRESS: {
        statusText: 'In progress',
        iconColorClass: 'contentPositive',
        icon: 'clock-time-four'
      },
      FAILED: {
        statusText: 'Failed',
        iconColorClass: 'contentNegative',
        icon: 'alert-circle'
      },
      REJECTED: {
        statusText: 'Rejected',
        iconColorClass: 'contentNegative',
        icon: 'alert-circle'
      },
      COMPLETED: {
        statusText: 'Completed',
        iconColorClass: 'contentPositive',
        icon: 'check-circle'
      }
    }
  },
  gold: {
    isBuyActionBlocked: true,
    isSellActionBlocked: false,
    buyBlockedErrorMsg: 'Investment in digital gold has been stopped for now',
    sellBlockedErrorMsg: '',
    minWithdrawAmount: 10
  },
  growth: {
    commodities360Masterclass: {
      'eventInfo': {
        'date': '14 August 2026',
        'time': '2:00 PM - 4:00 PM',
        'venue': 'Jio World Convention Center, Mumbai'
      },
      'registerCta': {
        'label': 'Secure your spot',
        'spotsFullLabel': 'Spots full',
        'spotsFullPopupTitle': 'All spots have been filled',
        'spotsFullPopupMessage': 'Thank you for the incredible response. Registrations for this edition are now closed.',
        'url': 'https://pages.razorpay.com/commodities360byGroww',
        'isSpotsFull': false
      },
      'navLinks': [
        { 'label': 'Home', 'href': '#home' },
        { 'label': 'Speakers', 'href': '#speakers' },
        { 'label': 'Agenda', 'href': '#agenda' }
      ],
      'hero': {
        'title': 'Commodities',
        'titleAccent': '360',
        'subtitleBrand': 'Groww',
        'subtitleSuffix': 'at Global Commodity Conclave 2026',
        'backgroundImageDesktop': 'https://cms-resources.groww.in/uploads/desktop_hero_bg_7bf0dc78c0.svg',
        'backgroundImageMobile': 'https://cms-resources.groww.in/uploads/Mask_group_13ecb94978.svg',
        'glowImage': 'https://cms-resources.groww.in/uploads/glow_b78ccf6e8b.svg',
        'detailIcons': {
          'calendar': 'https://cms-resources.groww.in/uploads/calendar_2dfbac47fc.svg',
          'clock': 'https://cms-resources.groww.in/uploads/clock_4ee2ea538d.svg',
          'mapPin': 'https://cms-resources.groww.in/uploads/map_pin_7a149b11d4.svg'
        }
      },
      'benefits': {
        'headingPrefix': 'Understand the markets',
        'headingMiddle': 'that',
        'headingAccent': 'move the world.',
        'subheading': 'Go beyond stocks and discover how experienced traders approach commodity markets through practical sessions, real strategies and actionable insights.',
        'items': [
          {
            'id': 1,
            'title': 'Learn from experienced traders',
            'description': 'Hear directly from traders who actively participate in commodity markets.',
            'iconUrl': 'https://cms-resources.groww.in/uploads/user_round_check_ebe797af87.svg'
          },
          {
            'id': 2,
            'title': 'Practical trading strategies',
            'description': 'Explore trend following, commodity options, risk management and execution.',
            'iconUrl': 'https://cms-resources.groww.in/uploads/chart_candlestick_e24a9f1453.svg'
          },
          {
            'id': 3,
            'title': 'Real market insights',
            'description': 'Understand how global events, volatility and macroeconomic factors shape commodity prices.',
            'iconUrl': 'https://cms-resources.groww.in/uploads/globe_202499aef4.svg'
          }
        ]
      },
      'speakers': {
        'headingPrefix': 'Meet the',
        'headingAccent': 'speakers',
        'items': [
          {
            'id': 1,
            'name': 'Arjun Tandon',
            'title': 'Founder,',
            'title2': ' Kailasa Capital',
            'profileImage': 'https://cms-resources.groww.in/uploads/desktop_speaker_1_8cdd38d49d.jpg'
          },
          {
            'id': 2,
            'name': 'Tanmay Kurtkoti',
            'title': 'Founder & CEO',
            'title2': ' QCAlpha',
            'profileImage': 'https://cms-resources.groww.in/uploads/desktop_speaker_2_2350d2b315.jpg'
          },
          {
            'id': 3,
            'name': 'Ashwin Raghavan',
            'title': 'Independent Trader',
            'title2': '',
            'profileImage': 'https://cms-resources.groww.in/uploads/desktop_speaker_3_48c2fe9ee8.jpg'
          },
          {
            'id': 4,
            'name': 'Nikhil Khandelwal',
            'title': 'Founder,',
            'title2': ' Volarb',
            'profileImage': 'https://cms-resources.groww.in/uploads/desktop_speaker_4_fb75a04852.jpg'
          },
          {
            'id': 5,
            'name': 'Souvik Das',
            'title': 'Founder,',
            'title2': ' Volarb',
            'profileImage': 'https://cms-resources.groww.in/uploads/desktop_speaker_5_1fdd491059.jpg'
          },
          {
            'id': 6,
            'name': 'Yogesh Nanda',
            'title': 'Partner,',
            'title2': ' Scalium Investments',
            'profileImage': 'https://cms-resources.groww.in/uploads/desktop_speaker_6_e38c9088c0.jpg'
          }
        ]
      },
      'agenda': {
        'headingBold': 'Agenda',
        'headingLight': 'of the day',
        'glowImage': 'https://cms-resources.groww.in/uploads/glow_b78ccf6e8b.svg',
        'items': [
          {
            'id': 1,
            'time': '1:45 PM - 2:00 PM',
            'title': 'Welcome and Networking',
            'description': 'Connect with fellow attendees.',
            'tag': 'OPENING'
          },
          {
            'id': 2,
            'time': '2:00 PM - 2:15 PM',
            'title': 'Commodity Market Challenge',
            'description': 'Interactive quiz and real-world market scenarios to test your understanding and win exciting prizes.',
            'tag': 'ACTIVITY'
          },
          {
            'id': 3,
            'time': '2:15 PM - 3:15 PM',
            'title': 'Trend Following in Commodities',
            'description': 'Learn how experienced traders identify trends, manage risk, build systematic trading frameworks, and get your questions answered in a live Q&A.',
            'tag': 'PANEL',
            'panelists': [ 'ARJUN TANDON', 'TANMAY KURTKOTI', 'ASHWIN RAGHAVAN' ]
          },
          {
            'id': 4,
            'time': '3:15 PM - 4:00 PM',
            'title': 'Commodity Options Trading',
            'description': 'Understand pricing, volatility, liquidity and practical options strategies from experienced traders, and get your questions answered in a live Q&A',
            'tag': 'PANEL',
            'panelists': [ 'NIKHIL KHANDELWAL', 'SOUVIK DAS', 'YOGESH NANDA' ]
          }
        ]
      },
      'footer': {
        'valueProps': [
          { 'id': 1, 'label': 'Decode', 'label2': 'market trends' },
          { 'id': 2, 'label': 'Practical', 'label2': 'trading strategies' },
          { 'id': 3, 'label': 'Live', 'label2': 'Q&A sessions' },
          { 'id': 4, 'label': 'Networking', 'label2': 'opportunities' }
        ],
        'footerImage': 'https://cms-resources.groww.in/uploads/desktop_reinforcement_fold_271b9aecea.jpg'
      }
    },
    showMuhuratFeature: false,
    muhuratCards: [
      {
        msg: 'Get ready for Muhurat trading',
        subMsg:
          'The 1-hour trading window opens on 12 Nov, 6:15 PM. Orders placed now will be executed on 12 Nov, 6:15 PM.',
        showTimer: false,
        image: 'preDiwali',
        openCardTimeISO: 1699610700000,
        closeCardTimeISO: 1699706700000
      },
      {
        msg: ' Muhurat trading: Countdown begins',
        subMsg: 'Trading starts in',
        showTimer: true,
        image: 'preDiwali',
        openCardTimeISO: 1699706700000,
        closeCardTimeISO: 1699793100000
      },
      {
        msg: 'Muhurat trading: Now live',
        subMsg: 'Make the most of this auspicious hour. Trading closes in',
        showTimer: true,
        image: 'duringDiwali',
        openCardTimeISO: 1699793100000,
        closeCardTimeISO: 1699796700000
      },
      {
        msg: 'Wishing you a delightful Diwali!',
        subMsg:
          'May the excitement of Muhurat trading hour set the tone for a prosperous evening ahead.',
        showTimer: false,
        image: 'postDiwali',
        openCardTimeISO: 1699796700000,
        closeCardTimeISO: 1699812900000
      }
    ]
  },
  investorRelation: {
    homePageDesktopHeading: 'Groww successfully lists<br/>on NSE and BSE',
    homePageMsiteHeading: 'Groww successfully lists on NSE and BSE'
  },
  hns: {
    hnsSearchLoginCheck: false,
    messageBoardCheck: false
  },
  terminal: {
    isLogoFromRemote: true,
    LOGO_URL_LIGHT_MODE: 'https://resources.groww.in/web-assets/img/website-logo/groww_terminal_light.svg',
    LOGO_URL_DARK_MODE: 'https://resources.groww.in/web-assets/img/website-logo/groww_terminal_dark.svg'
  },
  logo: {
    isLogoFromRemote: true,
    LOGO_URL_DARK_MODE: 'https://resources.groww.in/web-assets/img/website-logo/groww-logo-dark-logged-out.webp',
    LOGO_URL_LIGHT_MODE: 'https://resources.groww.in/web-assets/img/website-logo/groww_logo.webp'
  },
  storyLogo: {
    'unviewedDark': 'https://resources.groww.in/web-assets/img/website-logo/story_default_none_viewed_dark.png',
    'unviewedLight': 'https://resources.groww.in/web-assets/img/website-logo/story_default_none_viewed_light.png',
    'allViewedDark': 'https://resources.groww.in/web-assets/img/website-logo/story_default_all_viewed_dark.png',
    'allViewedLight': 'https://resources.groww.in/web-assets/img/website-logo/story_default_all_viewed_light.png'
  },
  loggedInLogo: {
    isLogoFromRemote: true,
    LOGO_URL_DARK_MODE: 'https://resources.groww.in/web-assets/img/website-logo/groww-logo-270.webp',
    LOGO_URL_LIGHT_MODE: 'https://resources.groww.in/web-assets/img/website-logo/groww-logo-270.webp'
  },
  externalLinks: {
    AADHAAR_PAN_LINK_URL:
      'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link-aadhaar',
    AADHAAR_PAN_BLOG_URL: 'https://www.youtube.com/watch?v=oQ_lqyyu-8Y'
  },
  onboarding: {
    nomineePendingRequestConfig: {
      header: 'Nominee update',
      title: 'Request Submitted',
      message:
        'Your nominee declaration request has been submitted. It takes up to 2 working days to get updated by the exchanges and CDSL.',
      ctaText: 'OKAY',
      ctaActionUrl: '/'
    }
  },
  nbtOnboarding: {
    kraVerificationData: {
      title: 'Contact verification pending',
      updateBtnLink: 'https://groww.in/user/profile/basic-details',
      verifyBtnLinks: {
        cvl: 'https://groww.in/kra/verify/cvl',
        CVLKRA: 'https://groww.in/kra/verify/cvl',
        cams: 'https://camskra.com/PanDetailsUpdate.aspx',
        CAMS: 'https://camskra.com/PanDetailsUpdate.aspx',
        ndml: 'https://kra.ndml.in/ClientInitiatedKYC-webApp',
        NDML: 'https://kra.ndml.in/ClientInitiatedKYC-webApp',
        karvy: 'https://www.karvykra.com/KYC_Validation/Default.aspx',
        KARVY: 'https://www.karvykra.com/KYC_Validation/Default.aspx',
        dotex: 'https://www.nsekra.com/',
        DOTEX: 'https://www.nsekra.com/'
      },
      descriptionText: {
        email:
          'Verify your email id below if it is correct. If it is incorrect, update your email id.',
        mob: 'Verify your mobile number below if it is correct. If it is incorrect, update your mobile number.',
        both: 'Verify your contact details if the details below are correct. If it is incorrect, update your contact details.'
      }
    }
  },
  platform: {
    appLens: {
      enableAppLensHttpMetrics: true,
      enableAppLensNavigationInstrumentation: true,
      enableAppLensTransactionInstrumentation: true
    }
  }
};
