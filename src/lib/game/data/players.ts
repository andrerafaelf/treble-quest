import type { PlayerSeason } from '$lib/game/types';

import { manUtd1992_93 } from './teams/man-utd-1992-93';
import { manUtd1998_99 } from './teams/man-utd-1998-99';
import { manUtd2002_03 } from './teams/man-utd-2002-03';
import { manUtd2007_08 } from './teams/man-utd-2007-08';
import { manUtd2012_13 } from './teams/man-utd-2012-13';
import { arsenal1997_98 } from './teams/arsenal-1997-98';
import { arsenal2001_02 } from './teams/arsenal-2001-02';
import { arsenal2003_04 } from './teams/arsenal-2003-04';
import { arsenal2013_14 } from './teams/arsenal-2013-14';
import { chelsea2004_05 } from './teams/chelsea-2004-05';
import { chelsea2009_10 } from './teams/chelsea-2009-10';
import { chelsea2011_12 } from './teams/chelsea-2011-12';
import { chelsea2016_17 } from './teams/chelsea-2016-17';
import { liverpool2005_06 } from './teams/liverpool-2005-06';
import { liverpool2013_14 } from './teams/liverpool-2013-14';
import { liverpool2018_19 } from './teams/liverpool-2018-19';
import { liverpool2019_20 } from './teams/liverpool-2019-20';
import { manCity2011_12 } from './teams/man-city-2011-12';
import { manCity2017_18 } from './teams/man-city-2017-18';
import { manCity2022_23 } from './teams/man-city-2022-23';
import { tottenham2004_05 } from './teams/tottenham-2004-05';
import { tottenham2009_10 } from './teams/tottenham-2009-10';
import { tottenham2018_19 } from './teams/tottenham-2018-19';
import { blackburn1994_95 } from './teams/blackburn-1994-95';
import { newcastle1995_96 } from './teams/newcastle-1995-96';
import { leeds1999_00 } from './teams/leeds-1999-00';
import { everton2004_05 } from './teams/everton-2004-05';
import { leicester2015_16 } from './teams/leicester-2015-16';
import { southampton2014_15 } from './teams/southampton-2014-15';
import { westHam2005_06 } from './teams/west-ham-2005-06';
import { astonVilla2009_10 } from './teams/aston-villa-2009-10';
import { portsmouth2007_08 } from './teams/portsmouth-2007-08';
import { wigan2012_13 } from './teams/wigan-2012-13';
import { fulham2009_10 } from './teams/fulham-2009-10';
import { middlesbrough2005_06 } from './teams/middlesbrough-2005-06';
import { bolton2004_05 } from './teams/bolton-2004-05';
import { ipswich2000_01 } from './teams/ipswich-2000-01';
import { charlton2003_04 } from './teams/charlton-2003-04';
import { birmingham2010_11 } from './teams/birmingham-2010-11';
import { swansea2012_13 } from './teams/swansea-2012-13';
import { crystalPalace2015_16 } from './teams/crystal-palace-2015-16';
import { reading2006_07 } from './teams/reading-2006-07';

export const playerSeasons: PlayerSeason[] = [
  ...manUtd1992_93,
  ...manUtd1998_99,
  ...manUtd2002_03,
  ...manUtd2007_08,
  ...manUtd2012_13,
  ...arsenal1997_98,
  ...arsenal2001_02,
  ...arsenal2003_04,
  ...arsenal2013_14,
  ...chelsea2004_05,
  ...chelsea2009_10,
  ...chelsea2011_12,
  ...chelsea2016_17,
  ...liverpool2005_06,
  ...liverpool2013_14,
  ...liverpool2018_19,
  ...liverpool2019_20,
  ...manCity2011_12,
  ...manCity2017_18,
  ...manCity2022_23,
  ...tottenham2004_05,
  ...tottenham2009_10,
  ...tottenham2018_19,
  ...blackburn1994_95,
  ...newcastle1995_96,
  ...leeds1999_00,
  ...everton2004_05,
  ...leicester2015_16,
  ...southampton2014_15,
  ...westHam2005_06,
  ...astonVilla2009_10,
  ...portsmouth2007_08,
  ...wigan2012_13,
  ...fulham2009_10,
  ...middlesbrough2005_06,
  ...bolton2004_05,
  ...ipswich2000_01,
  ...charlton2003_04,
  ...birmingham2010_11,
  ...swansea2012_13,
  ...crystalPalace2015_16,
  ...reading2006_07,
];

export const players = playerSeasons;

export const clubSeasonPools = Array.from(
  playerSeasons
    .reduce(
      (map, player) => map.set(`${player.club}|${player.season}`, { club: player.club, season: player.season }),
      new Map<string, { club: string; season: string }>(),
    )
    .values(),
);
