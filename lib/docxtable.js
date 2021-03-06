var fast_image_size = require('fast-image-size');
module.exports = {

  // assume passed in an array of row objects
  getTable: function (rows, tblOpts, gen_private) {
    tblOpts = tblOpts || {};

    this.gen_private = gen_private;

    var self = this;

    return self._getBase(
      rows.map(function (row) {
        return self._getRow(
          row.map(function (cell) {
            cell = cell || {};
            if (typeof cell === 'string' || typeof cell === 'number') {
              var val = cell;
              cell = {
                val: val
              };
            }

            return self._getCell(cell.val, cell.opts, tblOpts);
          }),
          tblOpts
        );
      }),
      self._getColSpecs(rows, tblOpts),
      tblOpts
    );
  },

  _getBase: function (rowSpecs, colSpecs, opts) {
    var self = this;

    var baseTable = {
      "w:tbl": {
        "w:tblPr": {
          "w:tblStyle": {
            "@w:val": "a3"
          },
          "w:tblW": {
            "@w:w": "0",
            "@w:type": "auto"
          },
          "w:tblLook": {
            "@w:val": "04A0",
            "@w:firstRow": "1",
            "@w:lastRow": "0",
            "@w:firstColumn": "1",
            "@w:lastColumn": "0",
            "@w:noHBand": "0",
            "@w:noVBand": "1"
          }
        },
        "w:tblGrid": {
          "#list": colSpecs
        },
        "#list": [rowSpecs]
      }
    };

    var borders = {};
    if (opts.borders) {
      borders = {
        "w:top": { "@w:val": "single", "@w:sz": opts.borderSize, "@w:space": "0", "@w:color": opts.borderColor },
        "w:start": { "@w:val": "single", "@w:sz": opts.borderSize, "@w:space": "0", "@w:color": opts.borderColor },
        "w:bottom": { "@w:val": "single", "@w:sz": opts.borderSize, "@w:space": "0", "@w:color": opts.borderColor },
        "w:end": { "@w:val": "single", "@w:sz": opts.borderSize, "@w:space": "0", "@w:color": opts.borderColor },
        "w:insideH": { "@w:val": "single", "@w:sz": opts.bordersInsideH ? opts.borderSize : 0, "@w:space": "0", "@w:color": opts.bordersInsideH ? opts.borderColor : 'ffffff' },
      }
      if (opts.bordersInsideV) {
        borders["w:insideV"] = { "@w:val": "single", "@w:sz": opts.bordersInsideV ? opts.borderSize : 0, "@w:space": "0", "@w:color": opts.bordersInsideV ? opts.borderColor : 'ffffff' }
      }
    }

    if (opts.borders) {
      baseTable["w:tbl"]["w:tblPr"]["w:tblBorders"] = borders;
    }
    return baseTable;
  },

  _getColSpecs: function (cols, opts) {
    var self = this;
    return cols[0].map(function (val, idx) {
      return self._tblGrid(opts);
    });
  },

  // TODO
  _tblGrid: function (opts) {
    return {
      "w:gridCol": {
        "@w:w": opts.tableColWidth || "1"
      }
    };
  },


  _getRow: function (cells, opts) {
    return {
      "w:tr": {
        "@w:rsidR": "00995B51",
        "@w:rsidTr": "007F1D13",
        "#list": [cells] // populate this with an array of table cell objects
      }
    };
  },

  _getCell: function (val, opts, tblOpts) {
    opts = opts || {};
    // var b = {};
    var content = [{
      "w:p": {
        "@w:rsidR": "00995B51",
        "@w:rsidRPr": "00722E63",
        "@w:rsidRDefault": "00995B51",
        "w:pPr": {
          "w:jc": {
            "@w:val": opts.align || tblOpts.tableAlign || "center"
          },
          "w:spacing": {
            "@w:before": opts.paddingTop || "120",
            "@w:after": opts.paddingBottom || "60",
            "@w:line": opts.lineHeight || "276",
            "@w:lineRule": opts.lineRule || "auto",
          },
        },
        "w:r": {
          "@w:rsidRPr": "00722E63",
          "w:rPr": {
            "w:rFonts": {
              "@w:ascii": opts.fontFamily || tblOpts.tableFontFamily || "宋体",
              "@w:hAnsi": opts.fontFamily || tblOpts.tableFontFamily || "宋体"
            },
            "w:color": {
              "@w:val": opts.color || tblOpts.tableColor || "000"
            },
            "w:b": {},
            "w:sz": {
              "@w:val": opts.sz || tblOpts.sz || "24"
            },
            "w:szCs": {
              "@w:val": opts.sz || tblOpts.sz || "24"
            },
          },
          "w:t": val
        }
      }
    }]
    if (typeof val != 'string' && typeof val != 'number') {
      if (Array.isArray(val)) {
        content = this._getComplexCell(val, tblOpts);
      }
    } else {
      if (!opts.b) {
        delete content[0]["w:p"]["w:r"]["w:rPr"]["w:b"];
      }
    }
    var cellObj = {
      "w:tc": {
        "w:tcPr": {
          "w:tcW": {
            "@w:w": opts.cellColWidth || tblOpts.tableColWidth || "0",
            "@w:type": "dxa"
          },
          "w:shd": {
            "@w:val": "clear",
            "@w:color": "auto",
            "@w:fill": opts.shd && opts.shd.fill || "",
            "@w:themeFill": opts.shd && opts.shd.themeFill || "",
            "@w:themeFillTint": opts.shd && opts.shd.themeFillTint || ""
          }
        },
        "#list": [content]

      }
    }
    if (opts.gridSpan) {
      cellObj["w:tc"]["w:tcPr"]["w:gridSpan"] = {
        "@w:val": opts.gridSpan
      };
    }
    if (opts.vAlign) {
      cellObj["w:tc"]["w:tcPr"]["w:vAlign"] = {
        "@w:val": opts.vAlign
      };
    }
    var cellBorders = {};
    function parseBorder(border) {
      if (border) {
        return {
          "@w:color": border.color || "auto",
          "@w:space": border.space || "0",
          "@w:sz": border.sz || "4",
          "@w:val": border.val || "single"
        };
      }
      return null;
    }
    if (opts.borders) {
      if (opts.borders.left) {
        cellBorders["w:left"] = parseBorder(opts.borders.left);
      }
      if (opts.borders.right) {
        cellBorders["w:right"] = parseBorder(opts.borders.right);
      }
      if (opts.borders.top) {
        cellBorders["w:top"] = parseBorder(opts.borders.top);
      }
      if (opts.borders.bottom) {
        cellBorders["w:bottom"] = parseBorder(opts.borders.bottom);
      }
    }
    if (Object.keys(cellBorders).length > 0) {
      cellObj["w:tc"]["w:tcPr"]["w:tcBorders"] = cellBorders;
    }
    return cellObj;
  },
  _getComplexCell: function (cellVal, tblOpts) {
    var _this = this;
    var content = cellVal.map(function (cell) {
      /*
       * TODO: add more options. like adding tables , pictures etc
       */
      var rowObject = [];
      if (cell.type === 'text' || cell.type === 'number') {
        var opts = cell.opts || {};

        if (cell.inline) {
          cell.values.forEach(function (row) {
            var tempRow = {
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体",
                    "@w:hAnsi": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体"
                  },
                  "w:color": {
                    "@w:val": row.opts.color || tblOpts.tableColor || "000"
                  },
                  "w:b": {},
                  "w:sz": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  },
                  "w:szCs": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  }
                },
                "w:t": row.val
              }
            }
            if (!row.opts.b) {
              delete tempRow["w:r"]["w:rPr"]["w:b"];
            }
            rowObject.push(tempRow);
          })
        } else {
          tempRow = {
            "w:r": {
              "@w:rsidRPr": "00722E63",
              "w:rPr": {
                "w:rFonts": {
                  "@w:ascii": opts.fontFamily || tblOpts.tableFontFamily || "宋体",
                  "@w:hAnsi": opts.fontFamily || tblOpts.tableFontFamily || "宋体"
                },
                "w:color": {
                  "@w:val": opts.color || tblOpts.tableColor || "000"
                },
                "w:b": {},
                "w:sz": {
                  "@w:val": opts.sz || tblOpts.sz || "16"
                },
                "w:szCs": {
                  "@w:val": opts.sz || tblOpts.sz || "16"
                }
              },
              "w:t": cell.val
            }
          }
          if (!opts.b) {
            delete tempRow["w:r"]["w:rPr"]["w:b"];
          }
          rowObject.push(tempRow);
        }
        return [
          {
            "w:p": {
              "@w:rsidR": "00995B51",
              "@w:rsidRPr": "00722E63",
              "@w:rsidRDefault": "00995B51",
              "w:pPr": {
                "w:jc": {
                  "@w:val": opts.align || tblOpts.tableAlign || "center"
                },
                "w:spacing": {
                  "@w:before": opts.paddingTop || "120",
                  "@w:after": opts.paddingBottom || "60",
                },
              },
              "#list": [rowObject]
            }
          }];
      }
      if (cell.type === 'image') {
        var image = _this._insertImage(cell.path, cell.opts, cell.type);
        var img = {
          "wp:inline": {
            "@distT": "0",
            "@distB": "0",
            "@distL": "0",
            "@distR": "0",

            "wp:extent": { "@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cy * Math.floor(12573.739)) },

            "wp:effectExtent": { "@l": "0", "@t": "0", "@r": "0", "@b": "0" },

            "wp:docPr": { "@id": "1", "@name": "Picture 0", "@descr": "Picture 0" },

            "wp:cNvGraphicFramePr": {
              "a:graphicFrameLocks": {
                "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                "@noChangeAspect": "1"
              }
            },

            "a:graphic": {
              "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
              "a:graphicData": {
                "@uri": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                "pic:pic": {
                  "@xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                  "pic:nvPicPr": {
                    "pic:cNvPr": { "@id": image.image_id, "@name": "Picture 0" },
                    "pic:cNvPicPr": {}
                  },
                  "pic:blipFill": {
                    "a:blip": { "@r:embed": "rId" + image.rel_id, "@cstate": "print" },
                    "a:stretch": {
                      "a:fillRect": {}
                    }
                  },
                  "pic:spPr": {
                    "a:xfrm": {
                      "a:off": { "@x": "0", "@y": "0" },
                      "a:ext": { "@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cy * Math.floor(12573.739)) }
                    },
                    "a:prstGeom": {
                      "@prst": "rect",
                      "a:avLst": {}
                    }
                  }
                }
              }
            }
          }
        }

        if (cell.opts.anchoredImage) {
          img = {
            "wp:anchor": {
              "@allowOverlap": "1",
              "@behindDoc": "1",
              "@distB": "0",
              "@distL": "0",
              "@distR": "0",
              "@distT": "10000",
              "@layoutInCell": "1",
              "@locked": "0",
              "@relativeHeight": "251656192",
              "@simplePos": "0",

              "wp:simplePos": { "@x": "0", "@y": "0" },

              "wp:positionH": {
                "@relativeFrom": "page",
                "wp:posOffset": image.options.offsetH || "191106"
              },
              "wp:positionV": {
                "@relativeFrom": "page",
                "wp:posOffset": image.options.offsetV || "240503"
              },

              "wp:extent": { "@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cy * Math.floor(12573.739)) },

              "wp:effectExtent": { "@l": "0", "@t": "0", "@r": "0", "@b": "0" },

              "wp:wrapNone": {},

              "wp:docPr": { "@id": "1", "@name": "Picture 0", "@descr": "Picture 0" },

              "wp:cNvGraphicFramePr": {
                "a:graphicFrameLocks": {
                  "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                  "@noChangeAspect": "1"
                }
              },

              "a:graphic": {
                "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                "a:graphicData": {
                  "@uri": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                  "pic:pic": {
                    "@xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                    "pic:nvPicPr": {
                      "pic:cNvPr": { "@id": image.image_id, "@name": "Picture 0" },
                      "pic:cNvPicPr": {}
                    },
                    "pic:blipFill": {
                      "a:blip": { "@r:embed": "rId" + image.rel_id, "@cstate": "print" },
                      "a:stretch": {
                        "a:fillRect": {}
                      }
                    },
                    "pic:spPr": {
                      "a:xfrm": {
                        "a:off": { "@x": "0", "@y": "0" },
                        "a:ext": { "@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cy * Math.floor(12573.739)) }
                      },
                      "a:prstGeom": {
                        "@prst": "rect",
                        "a:avLst": {}
                      }
                    }
                  }
                }
              }
            }
          }
        }

        let cellText = "";
        if (cell.text) {
          //if we have a text inline with the image add a space between the image & the text
          if (cell.opts.textAfterImage) {
            cellText = cell.text + " ";
          }
          else {
            cellText = " " + cell.text;
          }
        }

        var ret = [
          {
            "w:p": {
              "w:pPr": {
                "w:jc": {
                  "@w:val": cell.opts.align || "center"
                },
                "w:spacing": { // add some padding above and below so the image doesn't overlap the borders of the table
                  "@w:before": cell.opts.paddingTop || "100",
                  "@w:after": cell.opts.paddingBottom || "60",
                  "@w:line": cell.opts.lineHeight || "276",
                  "@w:lineRule": cell.opts.lineRule || "auto",
                }
              },
              "w:tcPr": {
                "w:vAlign": {
                  "@w:val": cell.opts.vAlign || "center"
                }
              },
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": cell.opts.fontFamily || "Avenir Book",
                    "@w:hAnsi": cell.opts.fontFamily || "Avenir Book"
                  },
                  "w:color": {
                    "@w:val": cell.opts.color || "000"
                  },
                  "w:b": {},
                  "w:sz": {
                    "@w:val": cell.opts.sz || "16"
                  },
                  "w:szCs": {
                    "@w:val": cell.opts.sz || "16"
                  }
                },
              }
            }
          }
        ];

        if (!cell.opts.b) {
          delete ret[0]["w:p"]["w:r"]["w:rPr"]["w:b"];
        }

        if (cell.opts.textAfterImage) {
          ret[0]["w:p"]["w:r"]["w:t"] = {
            "@xml:space": "preserve", // we must have a space between the image and the text
            "#text": cellText, // check xmlbuilder doc to see how to add text nodes
          };
          ret[0]["w:p"]["w:r"]["w:drawing"] = img;
        } else {
          ret[0]["w:p"]["w:r"]["w:drawing"] = img;
          ret[0]["w:p"]["w:r"]["w:t"] = {
            "@xml:space": "preserve", // we must have a space between the image and the text
            "#text": cellText, // check xmlbuilder doc to see how to add text nodes
          };
        }

        return ret;
      }
      if (!cell.type && cell.inline) {
        var opts = cell.opts || {};
        cell.values.forEach(function (row) {
          var tempRow = {};
          if (row.type && (row.type === 'text' || row.type === 'number')) {
            tempRow = {
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体",
                    "@w:hAnsi": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体"
                  },
                  "w:color": {
                    "@w:val": row.opts.color || tblOpts.tableColor || "000"
                  },
                  "w:b": {},
                  "w:sz": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  },
                  "w:szCs": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  }
                },
                "w:t": row.val
              }
            }
            if (!row.opts.b) {
              delete tempRow["w:r"]["w:rPr"]["w:b"];
            }
          }
          if (row.type && row.type === 'image') {
            var image = _this._insertImage(row.path, row.opts, row.type);
            var img = {
              "wp:inline": {
                "@distT": "0",
                "@distB": "0",
                "@distL": "0",
                "@distR": "0",

                "wp:extent": { "@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cx * Math.floor(12573.739)) },

                "wp:effectExtent": { "@l": "19050", "@t": "0", "@r": "9525", "@b": "0" },

                "wp:docPr": { "@id": "1", "@name": "Picture 0", "@descr": "Picture 0" },

                "wp:cNvGraphicFramePr": {
                  "a:graphicFrameLocks": {
                    "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                    "@noChangeAspect": "1"
                  }
                },

                "a:graphic": {
                  "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                  "a:graphicData": {
                    "@uri": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                    "pic:pic": {
                      "@xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                      "pic:nvPicPr": {
                        "pic:cNvPr": { "@id": image.image_id, "@name": "Picture 0" },
                        "pic:cNvPicPr": {}
                      },
                      "pic:blipFill": {
                        "a:blip": { "@r:embed": "rId" + image.rel_id, "@cstate": "print" },
                        "a:stretch": {
                          "a:fillRect": {}
                        }
                      },
                      "pic:spPr": {
                        "a:xfrm": {
                          "a:off": { "@x": "0", "@y": "0" },
                          "a:ext": { "@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cx * Math.floor(12573.739)) }
                        },
                        "a:prstGeom": {
                          "@prst": "rect",
                          "a:avLst": {}
                        }
                      }
                    }
                  }
                }
              }
            }
            tempRow = {
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": "宋体",
                    "@w:hAnsi": "宋体"
                  }
                },
                "w:drawing": img
              }
            }
          }
          if (row.type && row.type === 'lineBreak') {
            tempRow = {
              "w:r": {
                "w:br": {}
              }
            }
          }
          rowObject.push(tempRow);
        })
        return [
          {
            "w:p": {
              "@w:rsidR": "00995B51",
              "@w:rsidRPr": "00722E63",
              "@w:rsidRDefault": "00995B51",
              "w:pPr": {
                "w:jc": {
                  "@w:val": opts.align || tblOpts.tableAlign || "center"
                },
              },
              "#list": [rowObject]
            }
          }];
      }
    })
    return content;
  },
  _insertImage: function (image_path, opt, image_format_type) {
    var image_type = (typeof image_format_type == 'string') ? image_format_type : 'png';
    var defWidth = 320;
    var defHeight = 200;

    if (typeof image_path == 'string') {
      var ret_data = fast_image_size(image_path);
      if (ret_data.type == 'unknown') {
        var image_ext = path.extname(image_path);

        switch (image_ext) {
          case '.bmp':
            image_type = 'bmp';
            break;

          case '.gif':
            image_type = 'gif';
            break;

          case '.jpg':
          case '.jpeg':
            image_type = 'jpeg';
            break;

          case '.emf':
            image_type = 'emf';
            break;

          case '.tiff':
            image_type = 'tiff';
            break;
        } // End of switch.

      } else {
        if (ret_data.width) {
          defWidth = ret_data.width;
        } // Endif.

        if (ret_data.height) {
          defHeight = ret_data.height;
        } // Endif.

        image_type = ret_data.type;
        if (image_type == 'jpg') {
          image_type = 'jpeg';
        } // Endif.
      } // Endif.
    } // Endif.


    var imgObj = { image: image_path, options: opt || {} };

    if (!imgObj.options.cx && defWidth) {
      imgObj.options.cx = defWidth;
    } // Endif.

    if (!imgObj.options.cy && defHeight) {
      imgObj.options.cy = defHeight;
    } // Endif.

    var image_id = this.gen_private.type.msoffice.src_files_list.indexOf(image_path);
    var image_rel_id = -1;

    if (image_id >= 0) {
      for (var j = 0, total_size_j = this.gen_private.type.msoffice.rels_app.length; j < total_size_j; j++) {
        if (this.gen_private.type.msoffice.rels_app[j].target == ('media/image' + (image_id + 1) + '.' + image_type)) {
          image_rel_id = j + 1;
        } // Endif.
      } // Endif.

    } else {
      image_id = this.gen_private.type.msoffice.src_files_list.length;
      this.gen_private.type.msoffice.src_files_list[image_id] = image_path;
      this.gen_private.plugs.intAddAnyResourceToParse('word\\media\\image' + (image_id + 1) + '.' + image_type, (typeof image_path == 'string') ? 'file' : 'stream', image_path, null, false);
    } // Endif.

    if (image_rel_id == -1) {
      image_rel_id = this.gen_private.type.msoffice.rels_app.length + 1;

      this.gen_private.type.msoffice.rels_app.push(
        {
          type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
          target: 'media/image' + (image_id + 1) + '.' + image_type,
          clear: 'data'
        }
      );
    } // Endif.


    if ((opt || {}).link) {

      var link_rel_id = this.gen_private.type.msoffice.rels_app.length + 1;

      this.gen_private.type.msoffice.rels_app.push({
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
        target: opt.link,
        targetMode: 'External'
      });

      imgObj.link_rel_id = link_rel_id;

    } // Endif.

    imgObj.image_id = image_id;
    imgObj.rel_id = image_rel_id;
    return imgObj;
  }
};
