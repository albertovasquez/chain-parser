# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 0.0.0.0 (MySQL 5.7.20)
# Database: blockchain
# Generation Time: 2020-06-23 03:03:10 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table address
# ------------------------------------------------------------

CREATE TABLE `address` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(68) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table block
# ------------------------------------------------------------

CREATE TABLE `block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(68) NOT NULL DEFAULT '',
  `blocktime` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table exchange_hash
# ------------------------------------------------------------

CREATE TABLE `exchange_hash` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `exchangeid` int(11) NOT NULL,
  `addressid` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table historical
# ------------------------------------------------------------

CREATE TABLE `historical` (
  `Date` varchar(255) DEFAULT NULL,
  `Price` varchar(255) DEFAULT NULL,
  `PriceDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table input
# ------------------------------------------------------------

CREATE TABLE `input` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `addressid` int(11) NOT NULL,
  `transactionid` int(11) NOT NULL,
  `spentFromOutputId` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table output
# ------------------------------------------------------------

CREATE TABLE `output` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `addressid` int(11) NOT NULL,
  `transactionid` int(11) NOT NULL,
  `transactionindex` int(11) NOT NULL,
  `scriptpubkeytype` int(2) NOT NULL,
  `value` bigint(20) NOT NULL,
  `spentInInputId` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table transaction
# ------------------------------------------------------------

CREATE TABLE `transaction` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `blockid` int(11) NOT NULL,
  `hash` varchar(68) NOT NULL DEFAULT '',
  `transactiontime` int(11) NOT NULL DEFAULT '0',
  `locktime` int(11) NOT NULL,
  `size` int(11) NOT NULL,
  `vsize` float NOT NULL,
  `weight` int(11) NOT NULL,
  `version` int(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
