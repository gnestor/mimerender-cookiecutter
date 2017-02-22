#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function

#-----------------------------------------------------------------------------
# Minimal Python version sanity check
#-----------------------------------------------------------------------------

import sys

v = sys.version_info
if v[:2] < (2,7) or (v[0] >= 3 and v[:2] < (3,3)):
    error = "ERROR: %s requires Python version 2.7 or 3.3 or above." % name
    print(error, file=sys.stderr)
    sys.exit(1)

PY3 = (sys.version_info[0] >= 3)

import os
import pipes
from subprocess import check_call
from distutils import log
from distutils.cmd import Command
from setuptools import setup

repo_root = os.path.dirname(os.path.abspath(__file__))

if sys.platform == 'win32':
    from subprocess import list2cmdline
else:
    def list2cmdline(cmd_list):
        return ' '.join(map(pipes.quote, cmd_list))
        
def run(cmd, *args, **kwargs):
    """Echo a command before running it"""
    log.info('> ' + list2cmdline(cmd))
    kwargs['shell'] = (sys.platform == 'win32')
    return check_call(cmd, *args, **kwargs)
    
# BEFORE importing distutils, remove MANIFEST. distutils doesn't properly
# update it when the contents of directories change.
if os.path.exists('MANIFEST'): os.remove('MANIFEST')

class NPM(Command):
    description = 'Install JavaScript dependencies using npm'

    user_options = []

    # Representative files that should exist after a successful build
    targets = [
        # labextension
        os.path.join(repo_root, '{{cookiecutter.extension_name}}', 'static', '{{cookiecutter.extension_name}}.bundle.js'),
        os.path.join(repo_root, '{{cookiecutter.extension_name}}', 'static', '{{cookiecutter.extension_name}}.css'),
        # labextension
        os.path.join(repo_root, '{{cookiecutter.extension_name}}', 'static', 'index.js'),
        os.path.join(repo_root, '{{cookiecutter.extension_name}}', 'static', 'extension.js')
    ]

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def has_npm(self):
        try:
            run(['npm', '--version'])
            return True
        except:
            return False

    def run(self):
        has_npm = self.has_npm()
        if not has_npm:
            log.error("`npm` unavailable. If you're running this command using sudo, make sure `npm` is available to sudo")
        log.info("Installing labextension dependencies with npm. This may take a while...")
        run(['npm', 'install'], cwd=os.path.join(repo_root, 'labextension'))
        log.info("Installing nbextension dependencies with npm. This may take a while...")
        run(['npm', 'install'], cwd=os.path.join(repo_root, 'nbextension'))

        for t in self.targets:
            if not os.path.exists(t):
                msg = "Missing file: %s" % t
                if not has_npm:
                    msg += "\nnpm is required to build the development version"
                raise ValueError(msg)
        
class BuildCommand(develop):
    """Build Javascript extensions after Python installation"""
    def run(self):
        build_labextension()
        build_nbextension()
        develop.run(self)
        
setup_args = dict(
    name                    = '{{cookiecutter.extension_name}}',
    version                 = '0.1.0',
    packages                = ['{{cookiecutter.extension_name}}'],
    author                  = '{{cookiecutter.author_name}}',
    author_email            = '{{cookiecutter.author_email}}',
    keywords                = ['jupyter', 'jupyterlab', 'labextension', 'notebook', 'nbextension'],
    url                     = '',
    include_package_data    = True,
    install_requires        = [
        'jupyterlab>=0.16.0',
        'ipython>=1.0.0'
    ],
    cmdclass                = {
        'jsdeps': NPM
    }
)

if __name__ == '__main__':
    setup(**setup_args)
